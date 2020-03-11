#!/usr/bin/env python3
'''The tool to test or build the ppz site.
'''

import argparse
import jinja2
import toml


_CONFIG_FILE = 'config.toml'


def parse_config():
    return toml.load(_CONFIG_FILE)


def build(config):
    pass


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

