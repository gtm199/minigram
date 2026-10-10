from rest_framework import serializers


class FollowStateSerializer(serializers.Serializer):
    is_following = serializers.BooleanField()
    followers_count = serializers.IntegerField()
