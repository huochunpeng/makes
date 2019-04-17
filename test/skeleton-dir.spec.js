import test from 'ava';
import skeletonDir from '../lib/skeleton-dir';
import mockfs from 'mock-fs';
import path from 'path';
import fs from 'fs';
import rmdir from 'rimraf';

test.afterEach(() => {
  mockfs.restore();
});

test.serial('skeletonDir simply returns local dir', async t => {
  mockfs({
    '../my/dir/.keep': '',
    './my/dir/.keep': '',
  });
  t.is(await skeletonDir('../my/dir'), '../my/dir');
  t.is(await skeletonDir('./my/dir'), './my/dir');
});

test.serial('skeletonDir complains about missing local dir', async t => {
  mockfs();
  await t.throwsAsync(async() => skeletonDir('./my/dir'));
});

test.serial('skeletonDir complains about unresolved repo', async t => {
  function resolveRepo() {}

  await t.throwsAsync(async() => skeletonDir('something', {
    _resolve: resolveRepo
  }));
});

test.serial('skeletonDir returns tmp folder untar git repo, and caches it', async t => {
  mockfs({
    'tmp/.keep': ''
  });

  const repo = 'huochunpeng/debug-npm#v1.0.0';

  const dir = await skeletonDir(repo, {_tmpFolder: 'tmp'});
  t.truthy(fs.readdirSync(dir).includes('README.md'));
  t.truthy(fs.readFileSync(path.join(dir, 'README.md'), 'utf8').includes('debug repo for npm'));

  const dir2 = await skeletonDir(repo, {_tmpFolder: 'tmp'});
  t.is(dir2, dir);
  t.truthy(fs.readdirSync(dir2).includes('README.md'));
  t.truthy(fs.readFileSync(path.join(dir2, 'README.md'), 'utf8').includes('debug repo for npm'));
});

test.serial('skeletonDir complains about unknown repo type', async t => {
  function resolveRepo() {
    return {
      type: 'subversion',
      repo: 'lorem'
    };
  }

  await t.throwsAsync(async() => skeletonDir('something', {
    _resolve: resolveRepo
  }));
});

test.serial('skeletonDir returns tmp folder checked out git repo, and caches it', async t => {
  const repo = 'huochunpeng/debug-npm#v1.0.0';

  function resolveRepo(repo) {
    if (repo === 'huochunpeng/debug-npm#v1.0.0') {
      return {
        type: 'git',
        repo: 'git://github.com/huochunpeng/debug-npm.git',
        commit: '361ff261e60f60a91da09bb259230303ccef8087'
      };
    }
  }

  const dir = await skeletonDir(repo, {_resolve: resolveRepo, _tmpFolder: 'tmp'});
  t.truthy(fs.readdirSync(dir).includes('README.md'));
  t.truthy(fs.readFileSync(path.join(dir, 'README.md'), 'utf8').includes('debug repo for npm'));

  // use cache
  const dir2 = await skeletonDir(repo, {_resolve: resolveRepo, _tmpFolder: 'tmp'});
  t.is(dir2, dir);
  t.truthy(fs.readdirSync(dir2).includes('README.md'));
  t.truthy(fs.readFileSync(path.join(dir2, 'README.md'), 'utf8').includes('debug repo for npm'));

  rmdir.sync('tmp');
});
