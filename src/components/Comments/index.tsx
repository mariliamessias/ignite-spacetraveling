import { useEffect } from 'react';

export default function Comments() {
  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'mariliamessias/ignite-spacetraveling');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-light');
    anchor.appendChild(script);
  }, []);

  return <div id="inject-comments-for-uterances" />;
}
