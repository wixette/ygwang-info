#!/usr/bin/env python3
'''A lightweight CMS publish tool to build and test the ppz site.
'''

import argparse
import datetime
import http.server
import jinja2
import os
import re
import shutil
import socketserver
import tempfile
import toml


_CONFIG_FILE = 'config.toml'
_ROOT_DIR = os.path.join('dist', 'site')
_POSTS_DIR = 'posts'
_POST_EXT = '.md'
_TARGET_EXT = '.html'
_STATIC_DIR = 'static'
_INDEX_TEMP = 'index.html'
_POST_TEMP = 'post.html'
_TOC_TEMP = 'toc.html'
# Here pandoc is used to render Markdown files. The reason why other
# utils/libs such as python-markdown cannot be used: most markdown
# renderers have an issue when dealing with CJK line breaks. pandoc
# fixed this issue via the -f markdown_strict+east_asian_line_breaks
# flag. See pandoc's doc for details.
_PANDOC_CMD = 'pandoc -f markdown+east_asian_line_breaks %s -o %s'
_PANDOC_OUT = 'pandoc.out.html'


class ParseError(Exception):
    def __init__(self, msg):
        super().__init__(self, msg)


def parse_config():
    return toml.load(_CONFIG_FILE)


def render(env, config, template_name, target_path):
    template = env.get_template(template_name)
    html = template.render(config)
    with open(target_path, mode='w', encoding='utf-8') as f:
        f.write(html)


def format_snippet(lines, max_per_line):
    if not lines:
        return None
    snippet = ''
    # Only uses the first two lines or two paragraphs as the snippet.
    for line in lines[:2]:
        if len(line) > max_per_line:
            line = line[:max_per_line] + ' ...'
        snippet += '<p>' + line + '</p>'
    return snippet


def generate_poem_snippet(post_html):
    ret = re.search(r'<pre><code>(.*?)</code></pre>',
                    post_html, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if ret:
        lines = ret.group(1).split('\n')
        return format_snippet(lines, 40)
    else:
        return None


def generate_article_snippet(post_html):
    iter = re.finditer(r'<p>([^<]*?)</p>',
                       post_html, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    lines = []
    for i in iter:
        lines.append(i.group(1))
        if len(lines) >= 2:
            break
    return format_snippet(lines, 60)


def get_post_info(post_type, post_path, temporary_dir):
    # Renders post Markdown to HTML first then parse metadata from the
    # result HTML.
    pandoc_out_path = os.path.join(temporary_dir, _PANDOC_OUT)
    cmd = _PANDOC_CMD % (post_path, pandoc_out_path)
    os.system(cmd)
    with open(pandoc_out_path, 'r', encoding='utf-8') as f:
        post_html = f.read()
    post_info = {}

    # Stores genearted HTML.
    post_info['html'] = post_html

    # Parses post name form <h1> header.
    ret = re.search(r'<h1.*?>(.*?)</h1>',
                    post_html, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if ret:
        post_info['name'] = ret.group(1).strip().replace('\n', '')
    else:
        raise ParseError('no # header found in markdown post: %s' % post_path)

    # Parses post date from <p><strong> tag.
    ret = re.search(r'<p><strong>([0-9]+)-([0-9]+)-([0-9]+)</strong></p>',
                    post_html, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if ret:
        post_info['year'] = ret.group(1)
        post_info['month'] = ret.group(2)
        post_info['day'] = ret.group(3)
    else:
        raise ParseError('no __YYYY-MM-DD__ found in markdown post: %s'
                         % post_path)

    # Generates post snippet.
    if post_type == 'poem':
        post_info['snippet'] = generate_poem_snippet(post_html)
    elif post_type == 'article':
        post_info['snippet'] = generate_article_snippet(post_html)
    else:
        raise ParseError('app type post should not be parsed or rendered.')

    return post_info


def render_post():
    pass


def render_toc(env, config, post_metadata_list, toc_target_path):
    pass


def build(config):
    print('building %s' % config['title'])

    print('preparing %s' % _ROOT_DIR)
    shutil.rmtree(_ROOT_DIR, ignore_errors=True)
    os.makedirs(_ROOT_DIR, exist_ok=True)

    print('copying static contents to %s' % _ROOT_DIR)
    for static_file in os.listdir(_STATIC_DIR):
        static_path = os.path.join(_STATIC_DIR, static_file)
        print('copying %s to %s' % (static_path, _ROOT_DIR))
        if os.path.isdir(static_path):
            shutil.copytree(static_path,
                            os.path.join(_ROOT_DIR, static_file))
        else:
            shutil.copy2(static_path,
                         os.path.join(_ROOT_DIR, static_file))

    env = jinja2.Environment(
        loader=jinja2.PackageLoader('ppzsite', config['template_dir']),
        autoescape=jinja2.select_autoescape(['html', 'xml'])
    )

    # Additional propertis that are passed in as template context.
    config['cur_year'] = datetime.datetime.now().year
    config['cur_tab'] = { 'dir': 'index' }

    target_path = os.path.join(_ROOT_DIR, _INDEX_TEMP)
    print('rendering homepage %s' % target_path)
    render(env, config, _INDEX_TEMP, target_path)

    temporary_dir = tempfile.TemporaryDirectory()

    for tab in config['tabs']:
        if not tab['flat']:
            target_dir = os.path.join(_ROOT_DIR, tab['dir'])
            os.makedirs(target_dir)
        else:
            target_dir = _ROOT_DIR
        post_dir = os.path.join(_POSTS_DIR, tab['dir'])
        post_files = [f for f in os.listdir(post_dir)
                      if f.endswith(_POST_EXT)]
        post_info_list = []
        for post_file in post_files:
            target_file = post_file[:-len(_POST_EXT)] + _TARGET_EXT
            target_path = os.path.join(target_dir, target_file)
            post_path = os.path.join(post_dir, post_file)

            # Renders from markdown to html, then extracts metadata.
            print('pre-rendering %s from %s' % (target_path, post_path))
            post_info = get_post_info(tab['type'],
                                      post_path,
                                      temporary_dir.name)
            if not tab['flat']:
                post_info['link'] = '%s/%s' % (tab['dir'], target_file)
            else:
                post_info['link'] = target_file

            print(post_info)
            post_info_list.append(post_info)

            # Actually renders the post that has all info collected.
            # print('rendering %s from %s' % (target_path, post_path))


        toc_target_path = os.path.join(_ROOT_DIR, tab['dir'] + _TARGET_EXT)
        print('rendering TOC page %s' % toc_target_path)
        render_toc(env, config, post_info_list, toc_target_path)

    temporary_dir.cleanup()


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

