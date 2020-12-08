const diff = async <A>(options: Record<string, A>, rev: string) => {
  if (rev) {
    return `Diff at revision "${rev}"`;
  }

  return 'Unstaged diff';
};

export default {
  description: 'Show changes between commits, commit and working tree, etc',
  args: '[revision]',
  command: diff,
};
