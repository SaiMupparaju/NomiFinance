#!/usr/bin/env python3

import json

def prompt_yes_no(question):
    """Prompt user for yes/no answer."""
    while True:
        answer = input(f"{question} (y/n): ").lower().strip()
        if answer in ['y', 'yes']:
            return True
        elif answer in ['n', 'no']:
            return False
        else:
            print("Please answer y or n.")

def guess_placeholder_name(fact_value):
    """
    Simple helper: given a path like 'bank_of_america/plaid_checking_0000/expenses/since_1_week',
    generate a placeholder name (like 'accountPath' or 'timeFrameSnippet').
    This is not perfect—just an example.
    """
    if 'expenses' in fact_value:
        return 'accountPath'
    elif 'customValue' in fact_value:
        return 'amount'
    # etc. The user can change it anyway
    return 'placeholder'

def make_javascript_safe(string_value):
    """
    If we do naive string replacement, we might break JSON if there's quotes, etc.
    This is just a trivial function—really you'd do a robust approach.
    """
    return string_value.replace('"', '\\"')

def scan_and_prompt(rule_json, placeholders):
    """
    Recursively go through the rule_json to see if we find
    bank-of-america paths, 'custom_value', etc.
    If found, prompt user if they want it replaced by a variable placeholder.
    If yes, store a mapping in 'placeholders'.
    """

    if isinstance(rule_json, dict):
        # If there's a 'fact'
        if 'fact' in rule_json:
            fact_value = rule_json['fact']
            # e.g. "bank_of_america/plaid_checking_0000/expenses/since_1_week"
            # Prompt user if it is a variable
            print(f"Found a fact: {fact_value}")
            if prompt_yes_no("Should this be replaced by a placeholder?"):
                # guess a placeholder name
                placeholder_name = guess_placeholder_name(fact_value)
                new_name = input(f"Enter placeholder name to use (default: {placeholder_name}): ")
                if not new_name.strip():
                    new_name = placeholder_name
                placeholders[fact_value] = new_name
                rule_json['fact'] = f'${{{new_name}}}'

        # If there's a 'customValue'
        if 'params' in rule_json and 'customValue' in rule_json['params']:
            cv_val = rule_json['params']['customValue']
            print(f"Found a customValue: {cv_val}")
            if prompt_yes_no("Should this customValue be replaced by a placeholder?"):
                new_name = input("Enter placeholder name for customValue (e.g. 'amount'): ")
                placeholders[str(cv_val)] = new_name
                # store the placeholder
                rule_json['params']['customValue'] = f'${{{new_name}}}'

        # Recurse into each key
        for k, v in rule_json.items():
            scan_and_prompt(v, placeholders)

    elif isinstance(rule_json, list):
        for item in rule_json:
            scan_and_prompt(item, placeholders)

    # if it's just a string or number, do nothing


def main():
    # 1) Load the custom rule JSON (for example from a file)
    filename = input("Path to the custom rule JSON file: ")
    with open(filename, 'r') as f:
        data = json.load(f)

    # 2) Ask for applet info
    applet_id = input("Enter the new appletId (e.g. 'leisureExpenses'): ").strip()
    applet_title = input("Enter the applet's title (e.g. 'Check Leisurely Spending'): ").strip()
    applet_icon = input("Enter an emoji or icon for the applet (e.g. '🎉'): ").strip() or "🎉"

    # 3) We'll focus on data["rule"], ignoring top-level _id, isActive, jobId, etc.
    rule_part = data["rule"]  # This is the actual rule object

    # 4) placeholders dict to store all discovered placeholders
    placeholders = {}

    # 5) Walk the rule JSON, prompt for placeholders
    scan_and_prompt(rule_part, placeholders)

    # 6) Build the "inputs" array
    # For each placeholder we discovered, we guess an input type
    # This is naive: if placeholder name is "accountPath" => type = 'accountSelect'
    # if placeholder name is "amount" => type = 'number', etc.
    inputs = []
    for original_value, placeholder_name in placeholders.items():
        if placeholder_name.lower().startswith('account'):
            inputs.append({
                "key": placeholder_name,
                "label": f"Select the account (replaces {original_value})",
                "type": "accountSelect"
            })
        elif placeholder_name.lower().startswith('amount'):
            inputs.append({
                "key": placeholder_name,
                "label": "Enter the threshold amount",
                "type": "number"
            })
        else:
            inputs.append({
                "key": placeholder_name,
                "label": f"Replace {original_value} with?",
                "type": "text"
            })

    # 7) Construct final applet config object
    # We'll store the entire rule object in "ruleConfig"
    applet_config = {
        "id": applet_id,
        "icon": applet_icon,
        "title": applet_title,
        "ruleConfig": rule_part,  # Our updated JSON
        "inputs": inputs,
        "generateRule": (
            "function(formValues) {\n"
            "  // Example of naive placeholders replacement\n"
            "  return processAppletConfig(this.ruleConfig, formValues);\n"
            "}"
        )
    }

    # 8) Print the final JavaScript snippet
    print("\n\n---- Your new applet config ----\n\n")
    print("/* Insert into your appletConfigs in AppletConfigs.js */")
    js_output = json.dumps(applet_config, indent=2)
    # We do a minimal fix to look more like JS
    js_output = js_output.replace('"function(formValues)', 'function(formValues)')
    js_output = js_output.replace(';}\\n"', ";\n}")
    # Just a naive approach to remove quotes around "function(...)"

    print(f"{js_output}\n")

    print("\nDone! You can paste the above object into your `appletConfigs`.\n")


if __name__ == "__main__":
    main()
