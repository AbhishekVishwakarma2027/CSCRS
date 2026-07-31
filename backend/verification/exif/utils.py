def get_tag(tags, name, default=None):

    value = tags.get(name)

    if value is None:
        return default

    return str(value)