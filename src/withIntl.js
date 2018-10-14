import React from 'react';
import { addLocaleData, IntlProvider } from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';
import jaLocaleData from 'react-intl/locale-data/ja';
import enMessage from './locale/en.json';
import jaMessage from './locale/ja.json';

addLocaleData(enLocaleData);
addLocaleData(jaLocaleData);
const messageDefs = {
  en: enMessage,
  ja: jaMessage,
};

export function getLocaleKeyByApplicableObj(obj) {
  const localeTag = window.navigator.language;
  return localeTag in obj
    ? localeTag
    : localeTag.split('-')[0] in obj
      ? localeTag.split('-')[0]
      : null;
}

export default ComposedComponent => {
  return class WithIntl extends React.Component {
    render() {
      const localeTag = getLocaleKeyByApplicableObj(messageDefs) || 'en';
      return (
        <IntlProvider locale={localeTag} messages={messageDefs[localeTag]}>
          <ComposedComponent {...this.props} />
        </IntlProvider>
      );
    }
  };
};
