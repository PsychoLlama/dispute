const diff = async (options: Record<string, never>, rev: string) => {
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
