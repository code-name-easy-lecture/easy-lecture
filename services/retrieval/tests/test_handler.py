from app.handler import lambda_handler


def test_handler_returns_200():
    assert lambda_handler({}, None)["statusCode"] == 200