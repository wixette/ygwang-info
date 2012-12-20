#!/usr/bin/python
# -*- coding: utf-8 -*-


"""The site deployer.
"""


from django.conf import settings
from django.template.loader import render_to_string
import codecs
import datetime
import os
import shutil
import sys
import time


# Constant names of dirs, files, paths, commands, etc.
_CLOSURE_DIR = os.path.join('closure-library-read-only', 'closure')
_CLOSURE_THIRD_PARTY_DIR = os.path.join('closure-library-read-only',
                                        'third_party', 'closure')
_JS_COMPILER_JAR = os.path.join('closure-compiler-latest', 'compiler.jar')
_JS_LINTER_COMMAND = 'gjslint'
_DEPSWRITER_COMMAND = 'python %s --root_with_prefix=\"%s ../js\" > %s'
_DEPS_FILE = 'deps.js'
_TEMPLATE_DIR = 'templates'
_JS_DIR = 'js'
_POEM_DIR = 'poems'
_PHOTO_DIR = 'photos'
_IMAGE_DIR = 'images'
_STATIC_DIR = 'static'
_PUBS_DIR = 'pubs'
_COMPILE_COMMAND = 'python %s/bin/build/closurebuilder.py \
--root=%s \
--root=%s \
--root=%s \
--namespace="ppz.lucky" \
--output_mode=compiled \
--compiler_jar=%s \
--compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" \
--output_file=%s/ppz_compiled.js'

# Django templates for separate pages. A list of [template_file_name,
# target_dir_name]. template_file_name must not be empty. If target_dir_name is
# empty, the file(s) will be rendered to the root of the target dir.
_PAGE_TEMPLATES = [
    [ 'index.html', '' ],
    [ 'main.css', '' ],
    ]

# Static dirs/files. A list of [src_dir_name, target_dir_name,
# file_name]. src_dir_name must not be empty. If target_dir_name is empty, the
# file(s) will be copied to the root of the target dir. If file_name is empty,
# all files under src_dir_name will be copied.
_STATIC_CONTENTS = [
    [_IMAGE_DIR, _IMAGE_DIR, ''],
    [_STATIC_DIR, '', 'robots.txt'],
    [_STATIC_DIR, _PUBS_DIR, 'r5rscn.pdf']
    ]

# JS source code.
_JS_CODE = [
    'lucky.js',
    'util.js'
    ]


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
        'compile': self._compile,
        'sub_title': '',
        'cur_year': datetime.datetime.now().year,
        'is_tab_poem': True,
        'is_tab_photo': False,
        'is_tab_social': False,
        'poem_list': [],
        'the_poem': {},
        'max_length': 0,
        'photo_list': []
        }

    # Inits Django environment settings.
    settings.configure(DEBUG=True, TEMPLATE_DEBUG=True,
                       TEMPLATE_DIRS=[os.path.join(self._src_dir,
                                                   _TEMPLATE_DIR)])

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
        print 'Required %s does not exist.' % dir
        sys.exit(1)

  def copy_static_contents(self):
    """Copies the static contents which do not require template rendering to the
    target dir.
    """
    for from_dir_name, to_dir_name, file_name in _STATIC_CONTENTS:
      from_dir = os.path.join(self._src_dir, from_dir_name)
      to_dir = os.path.join(self._target_dir, to_dir_name)
      if not os.path.exists(to_dir):
        os.makedirs(to_dir)
      for f in [x for x in os.listdir(from_dir)
                if (not file_name) or file_name == x]:
        from_file = os.path.join(from_dir, f)
        to_file = os.path.join(to_dir, f)
        print '  %s to %s' % (from_file, to_file)
        shutil.copy2(from_file, to_file)

  def render_pages(self):
    """Renders Django page templates and copies the results to the target dir.
    """
    for file_name, to_dir_name in _PAGE_TEMPLATES:
      to_file = os.path.join(self._target_dir, to_dir_name, file_name)
      print '  %s' % to_file
      result = render_to_string(file_name, self._context)
      codecs.open(to_file, 'w', 'utf_8').write(result)

  def copy_closure_code(self):
    """Copies Closure source library code to the target js dir.
    """
    from_dir = os.path.join(self._closure_dir, 'goog')
    to_dir = os.path.join(self._target_dir, 'closure')
    if os.path.exists(to_dir):
      print '  Closure dir %s already exists.' % to_dir
    else:
      print '  %s to %s' % (from_dir, to_dir)
      shutil.copytree(from_dir, to_dir)

  def lint_js_code(self):
    """Lints JS code.
    """
    for file_name in _JS_CODE:
      js_file = os.path.join(self._src_dir, _JS_DIR, file_name)
      cmd = '%s \"%s\"' % (_JS_LINTER_COMMAND, js_file)
      print '  %s' % cmd
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
      print '  %s to %s' % (from_file, to_file)
      shutil.copy2(from_file, to_file)

  def gen_js_deps(self):
    js_dir = os.path.join(self._target_dir, _JS_DIR)
    deps_file = os.path.join(js_dir, _DEPS_FILE)
    depswriter_path = os.path.join(self._closure_dir,
                                   'bin', 'build', 'depswriter.py')
    cmd = _DEPSWRITER_COMMAND % (depswriter_path, js_dir, deps_file)
    print '  %s' % cmd
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
        print '  Delete uncompiled JS code path %s' % path
        shutil.rmtree(path)
    # Compiles the code
    cmd = _COMPILE_COMMAND % (self._closure_dir,
                              self._closure_dir,
                              self._closure_third_party_dir,
                              os.path.join(self._src_dir, _JS_DIR),
                              self._compiler_path,
                              self._target_dir)
    print '  %s' % cmd
    if os.system(cmd):
      sys.exit(1)


  def deploy(self):
    """Deploys the site.
    """
    print 'Deploying...'
    # For which compile mode a deploy step is executed.
    class _CompileMode(object):
      DEB = 0x1
      OPT = 0x2
      BOTH = 0x3

    # List of [step_function, step_name, compile_mode]
    DEPLOY_STEPS = [
        [self.copy_static_contents, 'Copy static constents', _CompileMode.BOTH],
        [self.render_pages, 'Render page templates', _CompileMode.BOTH],
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
        print '\n%s:' % step_name
        start_time = time.time()
        step_function()
        end_time = time.time()
        print '  %.4f secs' % (end_time - start_time)

    print
    print 'Done.'


def main():
  if len(sys.argv) <= 1:
    print 'Usage: %s <target_dir> [deb|opt]' % sys.argv[0]
    print 'Example: %s ~/www/ppz' % sys.argv[0]
    print 'Example: %s ~/www/ppz opt' % sys.argv[0]
    sys.exit(1)
  src_dir = os.path.split(os.path.realpath(sys.modules['__main__'].__file__))[0]
  target_dir = os.path.realpath(sys.argv[1])
  if not os.path.isdir(target_dir):
    print 'Target dir %s does not exist.' % target_dir
    sys.exit(1)
  compile_js_code = len(sys.argv) > 2 and sys.argv[2].lower() == 'opt'
  deployer = SiteDeployer(src_dir, target_dir, compile_js_code)
  deployer.deploy()


if __name__ == '__main__':
  main()
