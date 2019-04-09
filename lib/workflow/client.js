const ApiClient = require('../api');
const { MissingParamError } = require('../../errors');

class Workflow {
  constructor(settings, user) {
    const headers = {
      // eslint-disable-next-line camelcase
      Authorization: `bearer ${user.access_token}`,
      'Content-type': 'application/json'
    };
    Object.defineProperty(this, 'client', { value: ApiClient(settings, { headers }) });
    Object.defineProperty(this, 'profile', {
      get() {
        return user.profile || {};
      }
    });
  }

  validate(data, ...params) {
    params.forEach(param => {
      if (!data[param]) {
        throw new MissingParamError(param);
      }
    });
  }

  _pack(params) {
    return {
      ...params,
      changedBy: this.profile.id
    };
  }

  create(params) {
    this.validate(params, 'model');
    const { data = {}, meta = {}, model } = params;
    return this.client('/', {
      method: 'POST',
      json: this._pack({
        data,
        meta,
        model,
        action: 'create'
      })
    });
  }

  update(params) {
    this.validate(params, 'id', 'model');
    const { data = {}, meta = {}, model, id, action } = params;
    return this.client('/', {
      method: 'POST',
      json: this._pack({
        data,
        meta,
        model,
        id,
        action: action || 'update'
      })
    });
  }

  delete(params) {
    this.validate(params, 'id', 'model');
    const { data = {}, id, model, meta } = params;
    return this.client('/', {
      method: 'POST',
      json: this._pack({
        data,
        id,
        model,
        meta,
        action: 'delete'
      })
    });
  }

  task(taskId) {
    return {
      read: () => this.client(`/${taskId}`),
      status: ({ status, meta }) => {
        this.validate({ status, taskId }, 'status', 'taskId');
        return this.client(`/${taskId}/status`, {
          method: 'PUT',
          json: this._pack({
            status,
            meta
          })
        });
      }
    };
  }

  list({ query }) {
    return this.client('/', { query });
  }

  openTasks(modelId) {
    return this.client(`/model-tasks/${modelId}`);
  }
}

module.exports = Workflow;