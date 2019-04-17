import test from 'ava';
import config from '../lib/skeleton-config';
import mockfs from 'mock-fs';

test.afterEach(() => {
  mockfs.restore();
});

test.serial('skeletonConfig runs npm install when required', async t => {
  mockfs({
    'skeleton/package.json': '{"dependencies":{"foo":"1.0.0"}}'
  });

  let installed;
  function npmInstall(dir) {
    installed = dir;
  }

  const result = await config('skeleton', {_npmInstall: npmInstall});
  t.truthy(installed);
  t.deepEqual(result, {
    questions: [{
      name: 'name',
      message: 'Please name this project:',
      default: 'my-app'
    }],
    prependTransforms: [],
    appendTransforms: []
  });
});

test.serial('skeletonConfig skip npm install when not required', async t => {
  mockfs({
    'skeleton/package.json': '{}'
  });

  let installed;
  function npmInstall(dir) {
    installed = dir;
  }

  const result = await config('skeleton', {_npmInstall: npmInstall});
  t.falsy(installed);
  t.deepEqual(result, {
    questions: [{
      name: 'name',
      message: 'Please name this project:',
      default: 'my-app'
    }],
    prependTransforms: [],
    appendTransforms: []
  });
});

test.serial('skeletonConfig skip npm install when no packge.json', async t => {
  mockfs({
    'skeleton/.keep': ''
  });

  let installed;
  function npmInstall(dir) {
    installed = dir;
  }

  const result = await config('skeleton', {_npmInstall: npmInstall});
  t.falsy(installed);
  t.deepEqual(result, {
    questions: [{
      name: 'name',
      message: 'Please name this project:',
      default: 'my-app'
    }],
    prependTransforms: [],
    appendTransforms: []
  });
});

test.serial('skeletonConfig reads questions, and transforms', async t => {
  mockfs({
    'skeleton/questions.js': '',
    'skeleton/transforms.js': ''
  });

  function mockRequire(m) {
    m = m.replace(/\\/g, '/');
    if (m === 'skeleton/questions.js') {
      return [
        {name: 'description', message: 'Des'},
        {choices: [{value: 'one'}], message: 'Choose'}
      ];
    } else if (m === 'skeleton/transforms.js') {
      return {
        prepend: 'fake',
        append: ['fake2', 'fake3']
      };
    }
  }


  const result = await config('skeleton', {_require: mockRequire});
  t.deepEqual(result, {
    questions: [
      {
        name: 'name',
        message: 'Please name this project:',
        default: 'my-app'
      },
      {name: 'description', message: 'Des'},
      {choices: [{value: 'one'}], message: 'Choose'}
    ],
    prependTransforms: ['fake'],
    appendTransforms: ['fake2', 'fake3']
  });
});

test.serial('skeletonConfig does not inject question for project name if user provided one', async t => {
  mockfs({
    'skeleton/questions.js': '',
    'skeleton/transforms.js': ''
  });

  function mockRequire(m) {
    m = m.replace(/\\/g, '/');
    if (m === 'skeleton/questions.js') {
      return [
        {name: 'name', message: 'Name'},
        {name: 'description', message: 'Des'},
        {choices: [{value: 'one'}], message: 'Choose'}
      ];
    } else if (m === 'skeleton/transforms.js') {
      return {
      };
    }
  }


  const result = await config('skeleton', {_require: mockRequire});
  t.deepEqual(result, {
    questions: [
      {name: 'name', message: 'Name'},
      {name: 'description', message: 'Des'},
      {choices: [{value: 'one'}], message: 'Choose'}
    ],
    prependTransforms: [],
    appendTransforms: []
  });
});
