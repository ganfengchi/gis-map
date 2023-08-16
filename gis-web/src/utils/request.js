import axios from "axios";

const instance = axios.create({
  timeout: 1000 * 20,
});

instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (err) => {
    return Promise.reject(err);
  }
);

export let $get = async (url, params) => {
  let { data } = await instance.get(url, { params });
  return data;
};

export let $post = async (url, params) => {
  let { data } = await instance.post(url, params);
  return data;
};
