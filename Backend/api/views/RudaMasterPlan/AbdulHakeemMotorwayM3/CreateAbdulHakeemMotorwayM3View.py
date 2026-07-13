from ...common_imports import *


class CreateAbdulHakeemMotorwayM3View(viewsets.ViewSet):
    queryset = AbdulHakeemMotorwayM3.objects.all()
    serializer_class = AbdulHakeemMotorwayM3Serializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            serializer = AbdulHakeemMotorwayM3Serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            record = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="AbdulHakeemMotorwayM3 created successfully.",
                data=AbdulHakeemMotorwayM3Serializer(record).data,
                http_status=status.HTTP_201_CREATED,
            ).create_response()

        except serializers.ValidationError as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Serializer error.",
                data=e.detail,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()
