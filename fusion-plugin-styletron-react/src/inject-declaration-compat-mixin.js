export const injectDeclarationCompatMixin = Base =>
  class extends Base {
    injectDeclaration({prop, val, media, pseudo}) {
      let style = {[prop]: val};
      if (pseudo) {
        style = {
          [pseudo]: style,
        };
      }
      if (media) {
        style = {
          [media]: style,
        };
      }
      return this.renderStyle(style);
    }
  };
