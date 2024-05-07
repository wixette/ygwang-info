#!/usr/bin/env python3
"""Turn off draft tag for specified hugo posts."""


import os
import re
import sys


def undraft_post(post_dir, post_file):
    file_path = os.path.join(post_dir, post_file)
    print(f'Undrafting: {file_path}')
    with open(os.path.join(post_dir, post_file)) as f:
        content = f.read()
    new_content = re.sub(r'draft.*?=.*?true', 'draft = false', content)
    with open(os.path.join(post_dir, post_file), 'w') as f:
        f.write(new_content)


def main():
    if len(sys.argv) <= 1:
        print(f'Usage: {sys.argv[0]} post_files')
        sys.exit(1)

    for post_path in sys.argv[1:]:
        if os.path.isfile(post_path):
            post_dir, post_file = os.path.split(post_path)
            undraft_post(post_dir, post_file)


if __name__ == '__main__':
    main()
