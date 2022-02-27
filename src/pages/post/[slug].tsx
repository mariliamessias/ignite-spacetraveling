import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';

import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import Comments from '../../components/Comments';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    subtitle: string;
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps) {
  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function handleDate(date: String) {
    return format(parseISO(date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }

  const readingTime = post.data.content.reduce((acc, content) => {
    const wordsQuantity = RichText.asText(content.body).split(' ').length;

    const readingTimeResult = Math.ceil(wordsQuantity / 200);
    return acc + readingTimeResult;
  }, 0);

  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <div className={commonStyles.container}>
        <div className={styles.header}>
          <h1>{post.data.title}</h1>
          <section>
            <FiCalendar />
            <time>{handleDate(post.first_publication_date)}</time>
            <FiUser />
            <span>{post.data.author}</span>
            <FiClock />
            <span>{readingTime} min</span>
          </section>
        </div>
        {post.data.content.map(content => (
          <div className={styles.contentBody} key={content.heading}>
            <h1>{content.heading}</h1>
            <article
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
      </div>
      <div className={commonStyles.comment}>
        <Comments />
      </div>
      {preview && (
        <aside className={commonStyles.preview}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });
  const result = buildPosts(response);
  return {
    props: {
      post: result,
      revalidate: 600,
      preview,
    },
  };
};

function buildPosts(response: Post) {
  return {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };
}
