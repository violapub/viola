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
const localeTag = window.navigator.language;

export default ComposedComponent => {
  return class WithIntl extends React.Component {
    render() {
      const messages =
        localeTag in messageDefs
          ? messageDefs[localeTag]
          : localeTag.split('-')[0] in messageDefs
            ? messageDefs[localeTag.split('-')[0]]
            : {};
      return (
        <IntlProvider locale={localeTag} messages={messages}>
          <ComposedComponent {...this.props} />
        </IntlProvider>
      );
    }
  };
};
