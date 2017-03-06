"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var VK = require("./vk");
var DELAY_BETWEEN_REQUESTS = 1000;
var Graph = (function () {
    function Graph(options) {
        this.data = null;
        this.startingUserId = options.startingUserId;
        this.depth = options.depth;
        this.includeStartingUser = options.includeStartingUser;
    }
    Graph.prototype.graph = function () {
        if (this.data() !== null) {
            var exclude = this.includeStartingUser ? [this.startingUserId] : [];
            return VK.toGraph(this.data.friends, this.data.links, exclude);
        }
    };
    Graph.prototype.numUsersInGraph = function () {
        if (!this.graph)
            return this.graph().nodes.length;
    };
    Graph.prototype.start = function () {
        var _this = this;
        var trav = new VK.Traverser();
        trav.enqueue(this.startingUserId, this.depth);
        var onNext = function () {
            if (!trav.isCompleted()) {
                _this.numUsersInQueue = trav.queue.length;
                _this.numUsersCompleted = _.keys(trav.links).length;
                setTimeout(function () {
                    trav.next(onNext);
                }, DELAY_BETWEEN_REQUESTS);
            }
            else {
                _this.data = {
                    friends: trav.friends,
                    links: trav.links
                };
            }
        };
        trav.next(onNext);
    };
    return Graph;
}());
exports.default = Graph;
