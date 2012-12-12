#!/usr/bin/python


"""The site deployer.
"""


import os
import sys


class SiteDeployer(object):
  """Util class to compile and deploy the site.
  """

  _CLOSURE_DIR = os.path.join('closure-library-read-only', 'closure')

  _CALCDEPS_COMMAND = os.path.join('bin', 'calcdeps.py')

  _JS_COMPILER_JAR = os.path.join('closure-compiler-latest', 'compiler.jar')

  _JS_LINTER_COMMAND = 'gjslint'

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

  def check_prerequisites(self):
    """Checks if required dirs, files, etc. exist.
    """
    parent_dir = os.path.dirname(self._src_dir)
    self._closure_dir = os.path.join(parent_dir, SiteDeployer._CLOSURE_DIR)
    self._compiler_path = os.path.join(parent_dir,
                                       SiteDeployer._JS_COMPILER_JAR)
    for path in (self._closure_dir, self._compiler_path):
      if not os.path.exists(path):
        print 'Required %s does not exist.' % dir
    self._calcdeps_command = os.path.join(self._closure_dir,
                                          SiteDeployer._CALCDEPS_COMMAND)

  def deploy(self):
    """Deploys the site.
    """
    print 'Deploying...'


def main():
  if len(sys.argv) <= 1:
    print 'Usage: %s <target_dir> [dbg|opt]' % sys.argv[0]
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
