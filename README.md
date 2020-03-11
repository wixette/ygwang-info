# Personal CMS for the site pingpingze.com

## Configuration

See config.toml for details.

## Usage

Generates the dist dir and runs a simple httpserver for debug:

```
./ppzsite.py -t
```

Generates the dist dir and make a tarball for that. The contents under the dist dir can be copied to the root dir of the web server.

```
./ppzsite.py -d
```
