// @flow
type Options = {
  message?: string,
};

const commit = ({ message }: Options) => {
  return message ? `Committed` : 'Opening editor...';
};

export default {
  description: 'Record changes to the repository',
  command: commit,
  options: {
    message: {
      usage: '-m, --message <commit-message>',
    },
  },
};
