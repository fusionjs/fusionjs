import Plugin from '../plugin/plugin';

export default class SingletonPlugin extends Plugin {
  of() {
    return super.of();
  }
}
