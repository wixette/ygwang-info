#!/usr/bin/env python3
'''A lightweight CMS publish tool to build and test the ppz site.
'''

import argparse
import datetime
import http.server
import socketserver
import jinja2
import os
import shutil
import toml


_CONFIG_FILE = 'config.toml'
_ROOT_DIR = os.path.join('dist', 'site')
_STATIC_DIR = 'static'


def parse_config():
    return toml.load(_CONFIG_FILE)


def render(env, template_name, config, target_path):
    template = env.get_template(template_name)
    html = template.render(config)
    with open(target_path, mode='w', encoding='utf-8') as f:
        f.write(html)


def build(config):
    print('building %s' % config['title'])

    print('making the dir structure of under dist/.')
    shutil.rmtree(_ROOT_DIR, ignore_errors=True)
    os.makedirs(_ROOT_DIR, exist_ok=True)

    print('copying static contents to %s' % _ROOT_DIR)
    for file in os.listdir(_STATIC_DIR):
        path = os.path.join(_STATIC_DIR, file)
        print('copying %s to %s' % (file, _ROOT_DIR))
        if os.path.isdir(path):
            shutil.copytree(path, os.path.join(_ROOT_DIR, file))
        else:
            shutil.copy2(path, os.path.join(_ROOT_DIR, file))

    env = jinja2.Environment(
        loader=jinja2.PackageLoader('ppzsite', config['template_dir']),
        autoescape=jinja2.select_autoescape(['html', 'xml'])
    )

    # Additional propertis that are passed in as template context.
    config['cur_year'] = datetime.datetime.now().year
    config['cur_tab'] = { 'dir': 'index' }

    path = os.path.join(_ROOT_DIR, 'index.html')
    print('rendering %s' % path)
    render(env, 'index.html', config, path)
    print('done')

    for tab in config['tabs']:
        pass


def tar(config):
    pass


def test(config, port):
    print('running a simple HTTP server to test the site at:')
    print('http://127.0.0.1:%d/' % port)
    class MyHttpHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=_ROOT_DIR, **kwargs)
    server = http.server.HTTPServer(('', port), MyHttpHandler)
    server.serve_forever()


def main():
    parser = argparse.ArgumentParser(description='ppz site generator.')
    parser.add_argument(
        'cmd', choices=['dist', 'test'],
        help='command to execute. ' +
        'dist: builds the site at dist/site and ' +
        'makes its tarbar at dist/site.tar.gz. ' +
        'test: builds the site at dist/site and ' +
        'starts a simple server to test it.')
    parser.add_argument('--port', '-p', type=int, default=1234,
                        help='server port to start the test http server.')
    args = parser.parse_args()
    config = parse_config()
    if args.cmd == 'dist':
        build(config)
        tar(config)
    elif args.cmd == 'test':
        build(config)
        test(config, args.port)


if __name__ == '__main__':
    main()

