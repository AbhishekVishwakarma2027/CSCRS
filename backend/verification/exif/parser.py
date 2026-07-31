import exifread


class ExifParser:

    @staticmethod
    def extract(image_path):

        with open(image_path, "rb") as f:
            tags = exifread.process_file(f, details=False)

        return tags