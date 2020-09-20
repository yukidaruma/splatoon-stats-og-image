import fetch from 'node-fetch';

const client = async (path: string): Promise<Record<string, any> | any[]> => {
  const res = await fetch(`${process.env.SPLATOON_STATS_API_URL}/${path}`);

  return res.json();
};

export default client;
