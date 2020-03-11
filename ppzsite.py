#!/usr/bin/env python3
'''A lightweight CMS publish tool to build and test the ppz site.
'''

import argparse
import jinja2
import os
import shutil
import toml


_CONFIG_FILE = 'config.toml'


def parse_config():
    return toml.load(_CONFIG_FILE)


def build(config):
    print('building site %s' % config['title'])

    # Makes the dir structure of under dist/ and clears it.
    shutil.rmtree('dist/site/', ignore_errors=True)
    os.makedirs('dist/site/', exist_ok=True)

    # Copies the static contents to dist/site/
    for file in os.listdir('static/'):
        path = os.path.join('static/', file)
        if os.path.isdir(path):
            shutil.copytree(path, os.path.join('dist/site/', file))
        else:
            shutil.copy2(path, os.path.join('dist/site/', file))

    print('done')


def tar(config):
    pass


def test(config):
    pass


def main():
    parser = argparse.ArgumentParser(description='ppz site generator.')
    parser.add_argument(
        'cmd', choices=['dist', 'test'],
        help='command to execute. ' +
        'dist: builds the site at dist/site and ' +
        'makes its tarbar at dist/site.tar.gz. ' +
        'test: builds the site at dist/site and ' +
        'starts a simple server to test it.')
    args = parser.parse_args()
    config = parse_config()
    print(config)
    if args.cmd == 'dist':
        build(config)
        tar(config)
    elif args.cmd == 'test':
        build(config)
        test(config)


if __name__ == '__main__':
    main()

