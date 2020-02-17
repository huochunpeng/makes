const test = require('ava');
const whenFileExists = require('../../lib/write-project/when-file-exists');
const Vinyl = require('vinyl');
const mockfs = require('mock-fs');

test.afterEach(() => {
  mockfs.restore();
});

test.serial.cb('whenFileExists marks readme file with append write policy, when target file exists', t => {
  mockfs({
    'here/folder/some-readme.md': 'lorem'
  });

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/folder/some-readme.md',
    contents: Buffer.from('abc')
  });

  const ts = whenFileExists('here');

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'folder/some-readme.md');
    t.is(file.writePolicy, 'append');
    t.is(file.contents.toString(), 'abc');
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists honours existing readme file write policy mark, when target file exists', t => {
  mockfs({
    'here/folder/some-readme.md': 'lorem'
  });

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/folder/some-readme.md',
    contents: Buffer.from('abc'),
    writePolicy: 'ask'
  });

  const ts = whenFileExists('here', true);

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'folder/some-readme.md__makes');
    t.is(file.writePolicy, null);
    t.is(file.contents.toString(), 'abc');
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists does not mark readme file with append write policy, when target file does not exist', t => {
  mockfs();

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/folder/some-readme.md',
    contents: Buffer.from('abc')
  });

  const ts = whenFileExists('here');

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'folder/some-readme.md');
    t.is(file.writePolicy, undefined);
    t.is(file.contents.toString(), 'abc');
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists merges package.json no matter what is existing write policy mark, when target file exists', t => {
  mockfs({
    'here/package.json': '{"dependencies":{"foo":"1.0.0", "bar":"2.0.0"},"version":"1.1.2","name":"app"}'
  });

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/package.json',
    contents: Buffer.from('{"dependencies":{"lo":"3.0.0", "bar":"1.0.0"},"version":"0.1.0","name":"app","other":"field"}'),
    writePolicy: 'skip'
  });

  const ts = whenFileExists('here');

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'package.json');
    t.falsy(file.writePolicy);
    t.deepEqual(JSON.parse(file.contents.toString()), {
      name: 'app',
      version: '1.1.2',
      dependencies: {foo: '1.0.0', bar: '1.0.0', lo: '3.0.0'}
    });
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists passes through package.json, when target file does not exist', t => {
  mockfs();

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/package.json',
    contents: Buffer.from('{"dependencies":{"lo":"3.0.0", "bar":"1.0.0"},"version":"0.1.0","name":"app","other":"field"}'),
    writePolicy: 'skip'
  });

  const ts = whenFileExists('here');

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'package.json');
    t.is(file.writePolicy, 'skip');
    t.deepEqual(JSON.parse(file.contents.toString()), {
      name: 'app',
      other: 'field',
      version: '0.1.0',
      dependencies: {bar: '1.0.0', lo: '3.0.0'}
    });
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists does not ask, when target file does not exist', t => {
  mockfs();

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/some.file',
    contents: Buffer.from('abc'),
    writePolicy: 'ask'
  });

  const ts = whenFileExists('here');

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'some.file');
    t.is(file.writePolicy, 'ask');
    t.is(file.contents.toString(), 'abc');
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists does not ask in unattended mode, but keep existing file, when target file exists', t => {
  mockfs({
    'here/some.file': 'aaa'
  });

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/some.file',
    contents: Buffer.from('abc'),
    writePolicy: 'ask'
  });

  const ts = whenFileExists('here', true);

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'some.file__makes');
    t.is(file.writePolicy, null);
    t.is(file.contents.toString(), 'abc');
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists ask user, when user decided to keep existing file, when target file exists', t => {
  mockfs({
    'here/some.file': 'aaa'
  });

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/some.file',
    contents: Buffer.from('abc'),
    writePolicy: 'ask'
  });

  const ts = whenFileExists('here', false, () => Promise.resolve(false));

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'some.file__makes');
    t.is(file.writePolicy, null);
    t.is(file.contents.toString(), 'abc');
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists ask user, when user decided to replace existing file, when target file exists', t => {
  mockfs({
    'here/some.file': 'aaa'
  });

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/some.file',
    contents: Buffer.from('abc'),
    writePolicy: 'ask'
  });

  const ts = whenFileExists('here', false, () => Promise.resolve(true));

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'some.file');
    t.is(file.writePolicy, null);
    t.is(file.contents.toString(), 'abc');
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists passes through file with skip write policy, when target file does not exist', t => {
  mockfs();

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/folder/some.md',
    contents: Buffer.from('abc'),
    writePolicy: 'skip'
  });

  const ts = whenFileExists('here');

  ts.once('data', file => {
    t.truthy(file.isBuffer());
    t.is(file.relative.replace(/\\/g, '/'), 'folder/some.md');
    t.is(file.writePolicy, 'skip');
    t.is(file.contents.toString(), 'abc');
    t.end();
  });
  ts.write(file);
  ts.end();
});

test.serial.cb('whenFileExists skips file with skip write policy, when target file exists', t => {
  mockfs({
    'here/folder/some.md': 'lorem'
  });

  const file = new Vinyl({
    cwd: '/',
    base: '/test/',
    path: '/test/folder/some.md',
    contents: Buffer.from('abc'),
    writePolicy: 'skip'
  });

  const ts = whenFileExists('here');

  ts.once('data', () => {
    t.fail('should not see file');
    t.end();
  });
  ts.once('finish', () => {
    t.pass('finish without file');
    t.end();
  });
  ts.write(file);
  ts.end();
});
