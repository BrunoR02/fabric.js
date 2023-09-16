import setupApp from './setupApp';
import setupCodegen from './setupCodegen';
import setupCoverage from './setupCoverage';
import setupSelectors from './setupSelectors';

export default () => {
  // call first
  setupSelectors();
  // call before using fabric
  setupCoverage();
  // call at the end - navigates the page
  setupApp();
  setupCodegen();
};
