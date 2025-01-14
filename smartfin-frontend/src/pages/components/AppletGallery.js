const AppletGallery = () => {
    return (
      <Container>
        <Row>
          {Object.values(appletTemplates).map(applet => (
            <Col key={applet.id} md={4} className="mb-3">
              <Card 
                className="h-100 cursor-pointer"
                onClick={() => handleAppletSelect(applet)}
              >
                <Card.Body>
                  <div className="h4">
                    <span className="me-2">{applet.icon}</span>
                    {applet.title}
                  </div>
                  <Card.Text>{applet.description}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    );
  };