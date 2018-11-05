#!/usr/bin/env python3
# -*- coding: utf-8 -*-


"""The site deployer.
"""


import django
from django.conf import settings
from django.template.loader import render_to_string
import codecs
import datetime
import os
import shutil
import sys
import time


# Constant names of dirs, files, paths, commands, etc.
_CLOSURE_DIR = os.path.join('closure-library', 'closure')
_CLOSURE_THIRD_PARTY_DIR = os.path.join('closure-library',
                                        'third_party', 'closure')
_JS_COMPILER_JAR = os.path.join('closure-compiler', 'compiler.jar')
_JS_LINTER_COMMAND = 'gjslint'
_DEPSWRITER_COMMAND = 'python %s --root_with_prefix=\"%s ../js\" > %s'
_DEPS_FILE = 'deps.js'
_TEMPLATE_DIR = 'templates'
_JS_DIR = 'js'
_POEM_DIR = 'poems'
_POEM_TEMPLATE = 'poem.html'
_POEMS_LINK_TEMPLATE = 'poem_%04d.html'
_IMAGE_DIR = 'images'
_PSY_DIR = 'psy_index_json'
_STATIC_DIR = 'static'
_PUBS_DIR = 'pubs'
_COMPILE_COMMAND = ('java -jar %s '
                    '--manage_closure_dependencies '
                    '--only_closure_dependencies '
                    '--closure_entry_point=ppz.helper '
                    '--compilation_level=ADVANCED_OPTIMIZATIONS '
                    '--js=%s/**.js '
                    '--js=\'!%s/**_test.js\' '
                    '--js=\'!%s/**_tests.js\' '
                    '--js=%s/**.js '
                    '> %s/ppz_compiled.js')

# Django templates for separate pages. A list of [template_file_name,
# target_dir_name, target_file_name, sub_title]. template_file_name must not be
# empty. If target_dir_name is not privided, the file(s) will be rendered to the
# root of the target dir. If target_file_name is not provided, the
# templeate_file_name will be used.
_PAGE_TEMPLATES = [
    [ 'index.html', None, None, None],
    [ 'poems.html', None, None, '咏刚的诗'],
    [ 'pubs.html', None, None, '咏刚的著述' ],
    [ 'helper.html', None, None, None ],
    [ 'sitemap.xml', None, None, None ],
    [ 'atomfeed.xml', None, None, None ],
    ]

# Static dirs/files. A list of [src_dir_name, target_dir_name,
# file_name]. src_dir_name must not be empty. If target_dir_name is not
# provided, the file(s) will be copied to the root of the target dir. If
# file_name is not provided, all files under src_dir_name will be copied.
_STATIC_CONTENTS = [
    [_IMAGE_DIR, _IMAGE_DIR, None],
    [_PSY_DIR, _PSY_DIR, None],
    [_STATIC_DIR, None, 'robots.txt'],
    [_STATIC_DIR, None, 'style.css'],
    [_STATIC_DIR, None, 'bootstrap.b2.customized.min.css'],
    [_STATIC_DIR, None, 'bootstrap.b2.min.js'],
    [_STATIC_DIR, None, 'jquery-3.2.1.slim.min.js'],
    [_STATIC_DIR, None, 'popper.min.js'],
    ]

# JS source code.
_JS_CODE = [
    'helper.js'
    ]

_FULL_WIDTH_SPACE = u'\u3000'
_NBSP = u'\u00A0'

def _NormalizeSpaces(line):
  """Normalizes spaces in a plain-text line..
     1) Replaces ASCII space pair '\u0020\u0020' with CJK space '\u3000'.
     2) Replaces single ASCII space '\u0020' with one NBSP '\u00A0'.
  """
  if not line:
    return _NBSP
  return line.replace(u'  ', _FULL_WIDTH_SPACE).replace(u' ', _NBSP)


class SiteDeployer(object):
  """Util class to compile and deploy the site.
  """
  def __init__(self, src_dir, target_dir, compile_js_code):
    """Inits the attributes.

    Args:
        src_dir: The source dir of the ppzsite3.
        target_dir: The target dir where the site is deployed.
        compile_js_code: Boolean value to indicate whether the JS code need to
            be compiled before the site is deployed.
    """
    self._src_dir = src_dir
    self._target_dir = target_dir
    self._compile = compile_js_code
    self.check_prerequisites()

    # The context dict used to render Django templates. The defaults values are
    # assigned here.
    self._context  = {
        'template_name': '',
        'compile': self._compile,
        'sub_title': '',
        'cur_year': datetime.datetime.now().year,
        'last_update_time': '',
        'poems': [],
        'poem_title': '',
        'poem_date': '',
        'poem_notes': '',
        'poem_content': '',
        'poem_html_content': ''
        }

    # Inits Django environment settings.
    settings.configure(
      DEBUG=True,
      TEMPLATE_DEBUG=True,
      TEMPLATES=[{
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'APP_DIRS': True,
        'DIRS': [os.path.join(self._src_dir, _TEMPLATE_DIR)],
      }])

    django.setup()

  def check_prerequisites(self):
    """Checks if required dirs, files, etc. exist.
    """
    parent_dir = os.path.dirname(self._src_dir)
    self._closure_dir = os.path.join(parent_dir, _CLOSURE_DIR)
    self._closure_third_party_dir = os.path.join(parent_dir,
                                                 _CLOSURE_THIRD_PARTY_DIR)
    self._compiler_path = os.path.join(parent_dir,
                                       _JS_COMPILER_JAR)
    for path in [self._closure_dir,
                 self._closure_third_party_dir,
                 self._compiler_path]:
      if not os.path.exists(path):
        print('Required %s does not exist.' % path)
        sys.exit(1)

  def copy_static_contents(self):
    """Copies the static contents which do not require template rendering to the
    target dir.
    """
    for from_dir_name, to_dir_name, file_name in _STATIC_CONTENTS:
      if not to_dir_name:
        to_dir_name = ''
      if not file_name:
        file_name = ''
      from_dir = os.path.join(self._src_dir, from_dir_name)
      to_dir = os.path.join(self._target_dir, to_dir_name)
      if not os.path.exists(to_dir):
        os.makedirs(to_dir)
      for f in [x for x in os.listdir(from_dir)
                if (not file_name) or file_name == x]:
        from_file = os.path.join(from_dir, f)
        to_file = os.path.join(to_dir, f)
        print('  %s to %s' % (from_file, to_file))
        shutil.copy2(from_file, to_file)

  def generate_html_poem_summary(self, poem_lines):
    """Generates a short summary for the poem, in HTML format."""
    _SUFFIX = ' ...'
    _THRESHOLD = 15
    _MAX_LINES = 2
    summary_lines = []
    for line in poem_lines:
      if len(summary_lines) >= _MAX_LINES:
        break
      line = line.strip()
      if line:
        line = _NormalizeSpaces(line)
        if len(line) > _THRESHOLD:
          summary_lines.append(line[:_THRESHOLD] + _SUFFIX)
        elif len(summary_lines) < _MAX_LINES - 1:
          summary_lines.append(line)
        else:
          summary_lines.append(line + _SUFFIX)
    return ''.join(['<p>' + x + '</p>\n' for x in summary_lines])

  def prepare_poems(self):
    """Generates poems and stores them into the template context.
    """
    poem_dir = os.path.join(self._src_dir, _POEM_DIR)
    self._context['poems'] = []
    for f in [x for x in os.listdir(poem_dir) if x.endswith('.txt')]:
      lines = codecs.open(os.path.join(poem_dir, f), 'r', 'utf_8').readlines()
      title = lines[0].strip()
      date = lines[1].strip()
      poem_raw_content = ''.join(lines[2:])
      if lines[2].startswith('['):
        notes = lines[2].strip()[1:-1]
        poem = lines[3:]
      else:
        notes = ''
        poem = lines[2:]
      html_summary = self.generate_html_poem_summary(poem)
      self._context['poems'].append( {
          'title': title,
          'date': date,
          'notes': notes,
          'poem': poem,
          'poem_raw_content': poem_raw_content,
          'html_summary': html_summary,
          'link': ''
          })
    self._context['poems'].sort(key=lambda x: x['date'])
    self._context['last_update_time'] = self._context['poems'][-1]['date']
    for index, p in enumerate(self._context['poems']):
      link = _POEMS_LINK_TEMPLATE % index
      self._context['poems'][index]['link'] = link
      print('  %s, %s, %s' % (p['date'], p['link'], p['title']))

  def render_pages(self):
    """Renders Django page templates and copies the results to the target dir.
    """
    for file_name, to_dir_name, to_file_name, sub_title in _PAGE_TEMPLATES:
      if not to_dir_name:
        to_dir_name = ''
      if not to_file_name:
        to_file_name = file_name
      to_file = os.path.join(self._target_dir, to_dir_name, to_file_name)
      print(' rendering %s -> %s' % (file_name, to_file))
      self._context['template_name'] = file_name
      if sub_title:
        self._context['sub_title'] = sub_title
      result = render_to_string(file_name, self._context)
      codecs.open(to_file, 'w', 'utf_8').write(result)

  def render_individual_poems(self):
    """Renders individual poem pages.
    """
    for index, p in enumerate(self._context['poems']):
      self._context['template_name'] = _POEM_TEMPLATE
      self._context['sub_title'] = p['title']
      self._context['poem_title'] = p['title']
      date = '.'.join(p['date'].split('-')[0:2])
      self._context['poem_date'] = date
      self._context['poem_notes'] = p['notes']
      self._context['poem_content'] = ''.join(p['poem'])
      self._context['poem_html_content'] = ''.join([
          '<p>' + _NormalizeSpaces(x.strip()) + '</p>\n' for
          x in p['poem']])
      to_file = os.path.join(self._target_dir,
                             _POEMS_LINK_TEMPLATE % index)
      print('  %s' % to_file)
      result = render_to_string(_POEM_TEMPLATE, self._context)
      codecs.open(to_file, 'w', 'utf_8').write(result)

  def copy_closure_code(self):
    """Copies Closure source library code to the target js dir.
    """
    from_dir = os.path.join(self._closure_dir, 'goog')
    to_dir = os.path.join(self._target_dir, 'closure')
    if os.path.exists(to_dir):
      print('  Closure dir %s already exists.' % to_dir)
    else:
      print('  %s to %s' % (from_dir, to_dir))
      shutil.copytree(from_dir, to_dir)

  def lint_js_code(self):
    """Lints JS code.
    """
    for file_name in _JS_CODE:
      js_file = os.path.join(self._src_dir, _JS_DIR, file_name)
      cmd = '%s \"%s\"' % (_JS_LINTER_COMMAND, js_file)
      print('  %s' % cmd)
      if os.system(cmd):
        sys.exit(1)

  def copy_js_code(self):
    """Copies JS code to the target js dir.
    """
    for file_name in _JS_CODE:
      from_file = os.path.join(self._src_dir, _JS_DIR, file_name)
      js_dir = os.path.join(self._target_dir, _JS_DIR)
      if not os.path.exists(js_dir):
        os.makedirs(js_dir)
      to_file = os.path.join(js_dir, file_name)
      print('  %s to %s' % (from_file, to_file))
      shutil.copy2(from_file, to_file)

  def gen_js_deps(self):
    js_dir = os.path.join(self._target_dir, _JS_DIR)
    deps_file = os.path.join(js_dir, _DEPS_FILE)
    depswriter_path = os.path.join(self._closure_dir,
                                   'bin', 'build', 'depswriter.py')
    cmd = _DEPSWRITER_COMMAND % (depswriter_path, js_dir, deps_file)
    print('  %s' % cmd)
    if os.system(cmd):
      sys.exit(1)

  def compile_js_code(self):
    """Compiles JS code.
    """
    target_js_dir = os.path.join(self._target_dir, _JS_DIR)
    target_closure_dir = os.path.join(self._target_dir, 'closure')
    # Deletes uncompiled JS code if exists.
    for path in [target_js_dir, target_closure_dir]:
      if os.path.exists(path):
        print('  Delete uncompiled JS code path %s' % path)
        shutil.rmtree(path)
    # Compiles the code
    cmd = _COMPILE_COMMAND % (self._compiler_path,
                              self._closure_dir,
                              self._closure_dir,
                              self._closure_dir,
                              os.path.join(self._src_dir, _JS_DIR),
                              self._target_dir)
    print('  %s' % cmd)
    if os.system(cmd):
      sys.exit(1)


  def deploy(self):
    """Deploys the site.
    """
    print('Deploying...')
    # For which compile mode a deploy step is executed.
    class _CompileMode(object):
      DEB = 0x1
      OPT = 0x2
      BOTH = 0x3

    # List of [step_function, step_name, compile_mode]
    DEPLOY_STEPS = [
        [self.copy_static_contents, 'Copy static constents', _CompileMode.BOTH],
        [self.prepare_poems, 'Prepare poems', _CompileMode.BOTH],
        [self.render_pages, 'Render page templates', _CompileMode.BOTH],
        [self.render_individual_poems, 'Render poems', _CompileMode.BOTH],
        [self.copy_closure_code, 'Copy Google Closure code', _CompileMode.DEB],
        [self.lint_js_code, 'Lint JS code', _CompileMode.BOTH],
        [self.copy_js_code, 'Copy JS code', _CompileMode.DEB],
        [self.gen_js_deps, 'Generate JS dependencies', _CompileMode.DEB],
        [self.compile_js_code, 'Compile JS code', _CompileMode.OPT],
        ]

    if self._compile:
      current_mode = _CompileMode.OPT
    else:
      current_mode = _CompileMode.DEB

    for step_function, step_name, compile_mode in DEPLOY_STEPS:
      if compile_mode & current_mode:
        print('\n%s:' % step_name)
        start_time = time.time()
        step_function()
        end_time = time.time()
        print('  %.4f secs' % (end_time - start_time))

    print()
    print('Done.')


def main():
  if len(sys.argv) <= 1:
    print('Usage: %s <target_dir> [deb|opt]' % sys.argv[0])
    print('Example: %s ~/www/ppz' % sys.argv[0])
    print('Example: %s ~/www/ppz opt' % sys.argv[0])
    sys.exit(1)
  src_dir = os.path.split(os.path.realpath(sys.modules['__main__'].__file__))[0]
  target_dir = os.path.realpath(sys.argv[1])
  if not os.path.isdir(target_dir):
    print('Target dir %s does not exist.' % target_dir)
    sys.exit(1)
  compile_js_code = len(sys.argv) > 2 and sys.argv[2].lower() == 'opt'
  deployer = SiteDeployer(src_dir, target_dir, compile_js_code)
  deployer.deploy()


if __name__ == '__main__':
  main()
