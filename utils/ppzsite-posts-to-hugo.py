#!/usr/bin/env python3
"""Converts old ppzsite v3 format posts to hugo format."""


import datetime
import os
import re


TEMPLATE = '''+++
title = '{title}'
date = {date}
draft = true
+++
{quote}
<div class="poem">

```
{body}
```

</div>
'''


def parse_poem(content):
    title = re.search(r'^#\s+(.+)\s*$', content, re.MULTILINE).group(1)
    found = re.search(r'__([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])__',
                      content, re.MULTILINE)
    year = int(found.group(1))
    month = int(found.group(2))
    day = int(found.group(3))
    date = datetime.datetime(year, month, day)
    found = re.search(r'((^>.*$\n)+)', content, re.MULTILINE)
    quote = f'\n{found.group(1)}' if found else ''
    body = re.search(r'```.*?\n(.*)\n```', content,
                     re.MULTILINE | re.DOTALL).group(1)
    return title, date, quote, body


def convert_poem(index, poem_dir, poem_file):
    print(f'Converting #{index}: {poem_file}')
    path = os.path.join(poem_dir, poem_file)
    with open(path) as f:
        content = f.read()
    title, date, quote, body = parse_poem(content)
    new_content = TEMPLATE.format(title=title,
                                  date=date.isoformat(),
                                  quote=quote,
                                  body=body)
    print(new_content)
    with open(path, 'w') as f:
         f.write(new_content)


def convert_poems(poem_dir):
    poem_files = [x for x in os.listdir(poem_dir)
                  if re.match(r'poem_[0-9][0-9][0-9][0-9]\.md', x)]
    for i, poem_file in enumerate(sorted(poem_files)):
        convert_poem(i, poem_dir, poem_file)


def main():
    self_dir = os.path.dirname(os.path.abspath(__file__))
    poem_dir = os.path.join(self_dir, '../content/poems')
    convert_poems(poem_dir)


if __name__ == '__main__':
    main()
