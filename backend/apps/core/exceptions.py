import logging

from rest_framework import status
from rest_framework.exceptions import APIException, Throttled, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


class ConflictError(APIException):
    """HTTP 409: the request conflicts with current state (duplicate like/follow)."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "This action conflicts with the current state."
    default_code = "conflict"


def custom_exception_handler(exc, context):
    """Return every error in the {success, message, errors} envelope."""
    response = drf_exception_handler(exc, context)

    if response is None:
        # Unhandled server error: log the traceback, never expose it to clients.
        logger.exception("Unhandled exception", exc_info=exc)
        return Response(
            {"success": False, "message": "Something went wrong", "errors": {}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    errors = {}
    if isinstance(exc, ValidationError):
        message = "Validation failed"
        if isinstance(response.data, dict):
            errors = response.data
        else:
            errors = {"non_field_errors": response.data}
    elif isinstance(exc, Throttled):
        message = "Too many requests. Please try again later."
    else:
        detail = response.data.get("detail") if isinstance(response.data, dict) else None
        message = str(detail) if detail else "Request failed"

    response.data = {"success": False, "message": message, "errors": errors}
    return response
