from rest_framework.renderers import JSONRenderer


class EnvelopeJSONRenderer(JSONRenderer):
    """Wrap every successful response in {success, message, data}.

    Error responses are already wrapped by the custom exception handler, and views
    that call success_response() already return the envelope, so both pass through.
    Paginated lists therefore arrive as data = {count, next, previous, results}.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")
        if (
            response is not None
            and response.status_code < 400
            and response.status_code not in (204, 304)
            and not (isinstance(data, dict) and "success" in data)
        ):
            data = {"success": True, "message": "", "data": data if data is not None else {}}
        return super().render(data, accepted_media_type, renderer_context)
