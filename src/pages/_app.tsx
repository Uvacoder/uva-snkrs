import React from 'react';
import { AppProps } from 'next/app';

import { Layout } from 'src/components/layout';

import 'src/styles/index.css';
import { Metric, logMetric } from 'src/utils/log-metric';

const App = ({ Component, pageProps }: AppProps) => {
  React.useEffect(() => {
    const tracker = window.document.createElement('script');
    const firstScript = window.document.getElementsByTagName('script')[0];
    tracker.defer = true;
    tracker.setAttribute('site', 'HIUAENVC');
    tracker.setAttribute('spa', 'auto');
    tracker.src = 'https://kiwi.mcan.sh/script.js';
    firstScript.parentNode?.insertBefore(tracker, firstScript);
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
};

export const reportWebVitals = (metric: Metric) => {
  if (metric.label === 'web-vital') {
    logMetric(metric);
  }
};

export default App;
