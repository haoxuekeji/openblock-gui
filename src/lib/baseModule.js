import axios from 'axios';
// import router from '../router/index'
// import store from '../store'
// import { getToken, setToken, removeToken } from '@/utils/auth'

// import auth from '../common/auth'

class baseModule {
    constructor () {
        this.baseUrl = '';

        this.$http = axios.create({
            responseType: 'arraybuffer'
        // baseUrl: 'http://pan.haoxuekeji.com:5000/api/v1/'
        });
        /**
       * 请求拦截器
       */
        this.$http.interceptors.request.use(config => {
            const token = window.localStorage.getItem('token');
            if (token) {
            // let each request carry token
            // ['X-Token'] is a custom headers key
            // please modify it according to the actual situation
                config.headers['x-token'] = token;
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        error => Promise.error(error)
        );
        /**
       * 请求拦截
       */
        this.$http.interceptors.response.use(response => {
            if (response.headers['content-type'].indexOf('json') === -1) {
                // 返回的数据不是 json (或是 json 但服务器的 content-type 设置不准确)
                return response;
            }

            // 仅处理 json 数据
            let json;
            if (response.request.responseType === 'arraybuffer' &&
                response.data.toString() === '[object ArrayBuffer]') {
                const text = Buffer.from(response.data).toString('utf8');
                // const text = String.fromCharCode.apply(null, new Uint8Array(response.data))
                json = JSON.parse(text);
            } else {
                // 备注：不是 arraybuffer 可能会是 blob 等，这里暂未处理
                json = response.data;
            }
            response.data = json;
            return response;
        }, err => {

            if (err && err.response) {

                const response = err.response;
                if (response.headers['content-type'].indexOf('json') === -1) {
                    // 返回的数据不是 json (或是 json 但服务器的 content-type 设置不准确)
                } else {
                    // 仅处理 json 数据
                    let json;
                    if (response.request.responseType === 'arraybuffer' &&
                        response.data.toString() === '[object ArrayBuffer]') {
                        const text = Buffer.from(response.data).toString('utf8');
                        // const text = String.fromCharCode.apply(null, new Uint8Array(response.data))
                        json = JSON.parse(text);
                    } else {
                        // 备注：不是 arraybuffer 可能会是 blob 等，这里暂未处理
                        json = response.data;
                    }
                    response.data = json;
                    err.response.data = json;
                }

                switch (err.response.status) {
                case 401:
                    // Codes 5001/5002 (expired token) were meant to bounce the
                    // user to login here; the branch was never implemented, so
                    // the rejection just propagates to the caller.
                    break;
                case 403:
                    break;
                case 422:

                    break;
                }
            }
            return Promise.reject(err);
        }
        );
    }
    // Part of the window.api surface exposed to the host platform (see
    // lib/api.js), so the snake_case name has to stay.
    // eslint-disable-next-line camelcase
    to_login () {
        location.reload();
    // router.replace({
    //   path: '/login',
    //   query: {
    //     redirect: router.currentRoute.fullPath
    //   }
    // })
    }
    request (method, url, data) {
        if (method === 'delete' || method === 'get') {
            data = {params: data};
        }
        return new Promise((resolve, reject) => {
            this.$http[method](`${this.baseUrl}/api/v1/${url}`, data)
                .then(response => {
                    resolve(response);
                }, error => {
                    reject(error);
                });
        });
    }

    get (url, data) {
        data = {params: data};
        return this.$http.get(url, data);
    }

    post (url, data) {
        return this.$http.post(`${this.baseUrl}/api/v1/${url}`, data, {
            headers: {'content-type': 'application/x-www-form-urlencoded'}
        });
    }
//
//   put(url, data = undefined, config = {}) {
//     return this.$http.put(url, data, config)
//   }
//
//   delete(url,config = {}) {
//     return this.$http.put(url, config)
//   }
}

export default baseModule;
