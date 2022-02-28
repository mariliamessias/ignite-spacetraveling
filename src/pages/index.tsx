import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { FiUser, FiCalendar } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
  preview: boolean;
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const { results, next_page, preview } = postsPagination;

  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function handleLoadPosts(): Promise<void> {
    const response = await (await fetch(nextPage)).json();
    setPosts([...posts, ...response.results]);
    setNextPage(response.next_page);
  }

  function handleDate(date: String) {
    return format(parseISO(date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }
  return (
    <>
      <main className={commonStyles.containter}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a key={post.uid}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <section>
                  <FiCalendar />
                  <time>{handleDate(post.first_publication_date)}</time>
                  <FiUser />
                  <span>{post.data.author}</span>
                </section>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <div className={styles.continueReading}>
            <a onClick={handleLoadPosts}>Carregar mais posts</a>
          </div>
        )}

        {preview && (
          <aside className={commonStyles.preview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  const results = buildPosts(response);

  return {
    props: {
      postsPagination: {
        results,
        next_page: response.next_page,
        preview,
      },
    },
    revalidate: 600,
  };
};

function buildPosts(response: PostPagination) {
  return response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
}
