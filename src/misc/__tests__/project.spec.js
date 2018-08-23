const { SyncManager } = require('./../project');

describe('Assertion of retroact mechanisms of SyncMangaer', () => {
  it('Reduce simple history', () => {
    let act;
    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'create', filename: '/foo/yuno.txt' },
      { time: 20, action: 'create', filename: '/foo/miya.txt' },
      { time: 30, action: 'create', filename: '/foo/yuno.txt' },
    ]);
    expect(act).toEqual([
      { time: 20, action: 'create', filename: '/foo/miya.txt' },
      { time: 30, action: 'create', filename: '/foo/yuno.txt' },
    ]);

    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'delete', filename: '/foo/yuno.txt' },
      { time: 40, action: 'delete', filename: '/foo/yuno.txt' },
      { time: 20, action: 'create', filename: '/foo/yuno.txt' },
      { time: 30, action: 'create', filename: '/foo/yuno.txt' },
    ]);
    expect(act).toEqual([
      { time: 40, action: 'delete', filename: '/foo/yuno.txt' },
    ]);
  });

  it('Handle file move history', () => {
    let act;
    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'create', filename: '/foo/yuno.txt' },
      { time: 20, action: 'move', src: '/foo/yuno.txt', dst: '/bar/yuno.txt' },
      { time: 30, action: 'create', filename: '/bar/yuno.txt' },
      { time: 40, action: 'move', src: '/bar/yuno.txt', dst: '/foo' },
      { time: 50, action: 'create', filename: '/foo' },
    ]);
    expect(act).toEqual([
      { time: 20, action: 'move', src: '/foo/yuno.txt', dst: '/bar/yuno.txt' },
      { time: 40, action: 'move', src: '/bar/yuno.txt', dst: '/foo' },
      { time: 50, action: 'create', filename: '/foo' },
    ]);

    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'create', filename: '/yuno.txt' },
      { time: 20, action: 'move', src: '/miya.txt', dst: '/yuno.txt' },
    ]);
    expect(act).toEqual([
      { time: 20, action: 'move', src: '/miya.txt', dst: '/yuno.txt' },
    ]);

    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'create', filename: '/yuno.txt' },
      { time: 20, action: 'create', filename: '/miya.txt' },
      { time: 30, action: 'create', filename: '/nori.txt' },
      { time: 40, action: 'move', src: '/yuno.txt', dst: '/miya.txt' },
      { time: 50, action: 'move', src: '/miya.txt', dst: '/nori.txt' },
    ]);
    expect(act).toEqual([
      { time: 10, action: 'create', filename: '/yuno.txt' },
      { time: 40, action: 'move', src: '/yuno.txt', dst: '/miya.txt' },
      { time: 50, action: 'move', src: '/miya.txt', dst: '/nori.txt' },
    ]);

    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'create', filename: '/yuno.txt' },
      { time: 20, action: 'create', filename: '/miya.txt' },
      { time: 30, action: 'move', src: '/miya.txt', dst: '/hiro.txt' },
      { time: 40, action: 'move', src: '/yuno.txt', dst: '/miya.txt' },
    ]);
    expect(act).toEqual([
      { time: 10, action: 'create', filename: '/yuno.txt' },
      { time: 20, action: 'create', filename: '/miya.txt' },
      { time: 30, action: 'move', src: '/miya.txt', dst: '/hiro.txt' },
      { time: 40, action: 'move', src: '/yuno.txt', dst: '/miya.txt' },
    ]);
  });

  it('Handle directory move history', () => {
    let act;
    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'create', filename: '/dir1/yuno.txt'},
      { time: 20, action: 'create', filename: '/dir2/miya.txt'},
      { time: 30, action: 'move', src: '/dir1', dst: '/dir2'},
    ]);
    expect(act).toEqual([
      { time: 10, action: 'create', filename: '/dir1/yuno.txt'},
      { time: 30, action: 'move', src: '/dir1', dst: '/dir2'},
    ]);

    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'create', filename: '/a/b/c/yuno.txt'},
      { time: 20, action: 'move', src: '/a/b/c', dst: '/a/x'},
      { time: 30, action: 'move', src: '/a/x', dst: '/a/b' },
    ]);
    expect(act).toEqual([
      { time: 10, action: 'create', filename: '/a/b/c/yuno.txt'},
      { time: 20, action: 'move', src: '/a/b/c', dst: '/a/x'},
      { time: 30, action: 'move', src: '/a/x', dst: '/a/b' },
    ]);

    act = SyncManager.retroactFilerEvents([
      { time: 10, action: 'create', filename: '/foo/yuno.txt'},
      { time: 10, action: 'create', filename: '/foo/miya.txt'},
      { time: 20, action: 'move', src: '/foo', dst: '/bar'},
      { time: 30, action: 'move', src: '/bar', dst: '/foo' },
      { time: 40, action: 'create', filename: '/foo/yuno.txt'},
    ]);
    expect(act).toEqual([
      { time: 10, action: 'create', filename: '/foo/miya.txt'},
      { time: 20, action: 'move', src: '/foo', dst: '/bar'},
      { time: 30, action: 'move', src: '/bar', dst: '/foo' },
      { time: 40, action: 'create', filename: '/foo/yuno.txt'},
    ]);

  });
});
