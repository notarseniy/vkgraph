const appConfig = require('../config.json');

import * as _ from 'lodash';
import * as VKApi from 'node-vkapi';

declare var __ARGS__: any;
declare var __DETAILED__: any;
declare var API: any;

interface Queue {
  id: number,
  levels: number
}

interface QueuedIds {
  [propName: number]: boolean
}

const VK = new VKApi({
  token: appConfig.token
});

export class Traverser {
  
  friends: any[] = [];
  links: any = {};
  queue: Queue[] = [];
  queuedIds: QueuedIds = {};

  requester(requests, is_detailed, on_result) {
    let code = ('' + function () {
      var fields;
      var args = [__ARGS__];
      var is_detailed = [__DETAILED__];
      var results = [];
      var i = 0;
      
      while (i<args.length) {
        if (is_detailed[i]) {
          fields = "nickname, screen_name, sex, bdate, city, country, timezone, photo_50, contacts, relation";
        } else {
          fields = "";
        }
        results.push(API.friends.get({fields:fields, uid: args[i]}));

        i = i + 1;
      }
      return results;
    });

    code = code.replace('function () {', '');
    code = code.slice(0, code.length - 1);
    code = code.replace('__ARGS__', requests.map(function (el) { return el.id; }));
    code = code.replace('__DETAILED__', is_detailed);

    console.log('HEY', code, requests);
    
    VK.call('execute', {code: code}, function (data) {
      console.log('execute', data, is_detailed);
      
      if(data.response !== undefined) {
        var items = [];
        for (var i = 0; i < data.response.length; i++) {
          if (!is_detailed[i]) {
            items.push(_.map(data.response[i], function(id) {return {id: id}}));
          } else {
            items.push(_.map(data.response[i], function(u) {
              u.id = u.uid;
              return u;
            }));
          }
        }
        on_result(items);
      } else {
        console.error("Received error: ", data)
        // FIXME: handle error, not just ignore it
        on_result([])
      }
    });
  }

  enqueue(id, levels) {
    this.queue.push({
      id,
      levels
    });

    this.queuedIds[id] = true;

    console.log('enqueue', this);
  }

  next(onComplete) {
    console.log('next', this.queue);
    
    const requests = this.queue.splice(0, 25);
    var nonleafs = [];

    _.each(requests, (request) => {
      this.queuedIds[request.id] = undefined;
      nonleafs.push(request.levels > 0);
    });

    console.log('next.request', requests);

    if (!requests.length) {
      return false;
    }

    /* this.requester
     * @param {array} requests
     */
    //this.requester(request.id, nonleaf, function(items) {
    this.requester(requests, nonleafs, (items) => {
      console.log('requester: ', items, nonleafs);
      
      for (var i = 0; i < items.length; i++) {
        if (nonleafs[i]) {
          this.friends = _.uniq(items[i].concat(this.friends), function(f) {return f.id})
        }
        this.links[requests[i].id] = _.map(items[i], function(i) {return i.id})

        if (nonleafs[i]) {
          _.each(items[i], function(item) {
            if (!this.queued_ids[item.id] && !this.links[item.id]) {
              this.enqueue(item.id, requests[i].levels-1)
            }
          })
        }
      }
      
      onComplete();
    })
    return true;
  }

  isCompleted() {
    return !this.queue.length;
  }
}

const ATTRIBUTES = [
	{id: 0, title: 'first_name', type: 'string'},
	{id: 1, title: 'last_name', type: 'string'},
	{id: 2, title: 'nickname', type: 'string'},
	{id: 3, title: 'screen_name', type: 'string'},
	{id: 4, title: 'sex', type: 'integer'},
	{id: 5, title: 'photo_50', type: 'string'},
	{id: 6, title: 'relation', type: 'integer'},
	{id: 7, title: 'country', type: 'integer'},
	{id: 8, title: 'city', type: 'integer'},
	{id: 9, title: 'bdate', type: 'string'},
	{id: 10, title: 'education', type: 'integer'}
]

export function toGraph(friends, links, exclude_ids) {
	const friends_filtered = _.filter(friends, (f) => !_.contains(exclude_ids, f.id))
	const nodes = _.map(friends_filtered, (f) => {
		return {
			id: f.id,
			label: f.first_name + " " + f.last_name,
			attrs: {
				first_name: f.first_name,
				last_name: f.last_name,
				nickname: f.nickname,
				screen_name: f.screen_name,
				sex: f.sex,
				photo_50: f.photo_50,
				relation: f.relation,
				country: f.country,
				city: f.city,
				bdate: f.bdate,
				education: f.education
			}
		}
	})

	var node_ids = _.object(_.map(nodes, (n) => [n.id, true]));

	var edges = [];

	var edge_id = 0;
  
	_.each(links, (targets, source) => {
		if (node_ids[source] !== undefined) {
			_.each(_.filter(targets, (id) => node_ids[id] !== undefined), (target) => {
				edge_id++
				edges.push({
					id: edge_id,
					source: parseInt(source),
					target: target
				})
			})
		}
	})

	return {
		nodes: nodes,
		edges: edges,
		attribute_conf: ATTRIBUTES
	}
}

export function 
