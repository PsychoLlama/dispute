// @flow
type Options = {
  message?: string,
};

const commit = ({ message }: Options) => {
  return message ? `Committed` : 'Opening editor...';
};

export default {
  command: commit,
  options: {
    message: {
      usage: '-m, --message <commit-message>',
    },
  },
};
