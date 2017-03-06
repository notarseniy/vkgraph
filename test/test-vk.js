
describe("VK friends information module", function() {
	var generate_dummy = function(id, is_detailed) {
		if (is_detailed) {
			return {
				bdate: "20.10.1991",
				city: "2",
				country: "1",
				first_name: "Fgsfds",
				home_phone: "+728346763254",
				id: id,
				last_name: "Lastname",
				nickname: "Ololosha",
				online: 1,
				photo_50: "http://cs234765.vk.me/v45384574/5be7/CCDHDC_xw.jpg",
				relation: "4",
				screen_name: "tetetest_"+id,
				sex: 1,
				timezone: 3
			}
		} else {
			return {
				id: id
			}
		}
	}

	describe("Graph traverser", function() {
		var testdata_edges = [
			[75,76],[75,77],[75,79],[76,77],[76,79],[76,80],
			[77,79],[78,75],[78,76],[78,77],[78,79],[78,85],
			[78,92],[81,75],[81,82],[81,86],[82,75],[82,87],
			[83,75],[83,87],[86,80],[86,87],[87,88],[88,93],
			[92,88]
		]
		var starter_id = 76
		var testdata_mirrored = testdata_edges.concat(_.map(testdata_edges, function(i) {return [i[1], i[0]]}))
		var friends = _.groupBy(testdata_mirrored, "0")

		var Requester = function() {
			this.requests = []
		}
		Requester.prototype.simulateRequest = function(id, is_detailed) {
			this.requests.push({id: id, is_detailed: is_detailed})
			if (friends[id] === undefined) {return []}
			return _.map(friends[id], function(pairs) {
				return generate_dummy(pairs[1], is_detailed)
			})
		}

		describe("For depth of 1", function() {
			var req = new Requester()
			var trav = new vk.Traverser(function(id, is_detailed, on_result) {
				on_result(req.simulateRequest(id, is_detailed))
			})
			it("should complete", function(done) {
				trav.enqueue(starter_id, 1)
				var onNext = function() {
					if (!trav.isCompleted()) {
						trav.next(onNext)
					} else {
						done()
					}
				}
				trav.next(onNext)
			})
			it("should have 5 friends", function() {
				expect(trav.friends).to.have.length(5)
			})
			it("should have made 6 requests", function() {
				expect(req.requests).to.have.length(6)
			})
			it("should not have requested any user more than one time", function() {
				var request_counts = _.countBy(req.requests, "id")
				expect(_.max(request_counts)).to.be.not.above(1)
			})
			it("should return friends with ids: 75, 77, 78, 79, 80", function() {
				expect(_.map(trav.friends, function(u) {return u.id})).to.have.members([75, 77, 78, 79, 80])
			})
			it("should return friend 80 with connections to 76, 86", function() {
				expect(trav.links[80]).to.have.members([76, 86])
			})
			it("should return friend 79 with connections to 75, 76, 77, 78", function() {
				expect(trav.links[79]).to.have.members([75, 76, 77, 78])
			})
			it("should return friend 78 with connections to 75, 76, 77, 79, 85, 92", function() {
				expect(trav.links[78]).to.have.members([75, 76, 77, 79, 85, 92])
			})
		})
		
		describe("For depth of 2", function() {
			var req = new Requester()
			var trav = new vk.Traverser(function(id, is_detailed, on_result) {
				on_result(req.simulateRequest(id, is_detailed))
			})
			it("should complete", function(done) {
				trav.enqueue(starter_id, 2)
				var onNext = function() {
					if (!trav.isCompleted()) {
						trav.next(onNext)
					} else {
						done()
					}
				}
				trav.next(onNext)
			})
			it("should have 12 users found", function() {
				expect(trav.friends).to.have.length(12)
			})
			it("should have found users: 75, 76, 77, 78, 79, 80, 81, 82, 83, 85, 86, 92", function() {
				var ids = _.map(trav.friends, function(f) {return f.id})
				expect(ids).to.have.members([75, 76, 77, 78, 79, 80, 81, 82, 83, 85, 86, 92])
			})
			it("should have made 1 + 5 + 6 = 12 requests", function() {
				expect(req.requests).to.have.length(1 + 5 + 6)
			})
			it("should not have requested any user more than one time", function() {
				var request_counts = _.countBy(req.requests, "id")
				expect(_.max(request_counts)).to.be.not.above(1)
			})
			it("should have 12 links records", function() {
				expect(_.toArray(trav.links)).to.have.length(1 + 5 + 6)
			})
			it("should have done detailed requests to users 76; 75, 77, 78, 79, 80", function() {
				expect(_.map(_.filter(req.requests, function(r) {return r.is_detailed}), function(r) {return r.id})).
					to.have.members([76, 75, 77, 78, 79, 80])
			})
			it("should have done non-detailed requests to users 81, 82, 83, 85, 86, 92", function() {
				expect(_.map(_.filter(req.requests, function(r) {return !r.is_detailed}), function(r) {return r.id})).
					to.have.members([81, 82, 83, 85, 86, 92])				
			})
			it("should have user 92 with links to 78 and 88", function() {
				expect(trav.links[92]).to.have.members([78, 88])
			})
			it("should have user 80 with links to 76 and 86", function() {
				expect(trav.links[80]).to.have.members([76, 86])
			})
		})
	})

	describe("VK friends to graph converter", function() {
		var starter_id = 76
		var friends = _.map([80, 75, 79, 77, 78], function(id){
			return generate_dummy(id, true);
		})
		var links = {
			80: [86, 76],
			75: [83, 81, 82, 79, 77, 78, 76],
			79: [75, 77, 78, 76],
			77: [79, 78, 76, 75],
			78: [92, 76, 75, 79, 77, 85]
		}
		describe("result of vk.to_graph", function() {
			var result = vk.to_graph(friends, links, [starter_id])

			it("should contain keys: nodes, edges, attribute_conf", function() {
				expect(result).to.have.keys('nodes', 'edges', 'attribute_conf')
			})
			it("should have 5 nodes", function() {
				expect(result.nodes).to.have.length(5)
			})
			it("should have 2 x 6 = 12 edges", function() {
				expect(result.edges).to.have.length(2*6)
			})
			it("should have correct set of edges", function() {
				var edges_simple = _.map(result.edges, function(e) {return [e.source, e.target]})
				var expected_edges_half = [
					[75, 78], [75, 77], [75, 79],
					[77, 78], [78, 79], [77, 79]
				]
				var expected_edges = expected_edges_half.concat(_.map(expected_edges_half, function(e) {return [e[1], e[0]]}))

				expected_edges = _.sortBy(_.sortBy(expected_edges, "1"), "0")
				edges_simple = _.sortBy(_.sortBy(edges_simple, "1"), "0")

				expect(edges_simple).to.deep.equal(expected_edges)
			})
			it("should have correct ids on edges", function() {
				var edge_ids = _.uniq(_.map(result.edges, function(e) {return e.id}))
				expect(edge_ids).to.have.length(2*6)
				_.each(edge_ids, function(id) {expect(id).to.be.a("number")})
			})
			it("should have nodes with ids 80, 75, 79, 77, 78", function() {
				var node_ids = _.map(result.nodes, function(n) {return n.id})
				expect(node_ids).to.have.members([80, 75, 79, 77, 78])
			})
			it("should contain node labels", function() {
				var node_labels = _.map(result.nodes, function(n) {return n.label})
				expect(node_labels).to.have.members(["Fgsfds Lastname"])
			})
			it("should contain node attributes", function() {
				_.each(result.nodes, function(node) {
					expect(node.attrs).to.have.keys(['first_name', 'last_name', 'nickname', 'screen_name', 'sex', 'photo_50', 'relation', 'country', 'city', 'bdate', 'timezone'])

					expect(node.attrs.first_name).to.equal("Fgsfds")
					expect(node.attrs.last_name).to.equal("Lastname")
					expect(node.attrs.nickname).to.equal("Ololosha")
					expect(node.attrs.screen_name).to.equal("tetetest_"+node.id)
					expect(node.attrs.sex).to.equal(1)
					expect(node.attrs.photo_50).to.equal("http://cs234765.vk.me/v45384574/5be7/CCDHDC_xw.jpg")
				})
			})
			it("should return correct attributes configuration", function() {
				expect(result.attribute_conf).to.be.not.empty
				_.each(result.attribute_conf, function(c) {
					expect(c).to.have.keys(['id', 'title', 'type'])
				})
			})
		})
	})

	describe("Fake API", function() {
		var fake_api = new vk.FakeAPI()
		it("should contain users", function() {
			expect(fake_api.users).to.be.not.empty
		})
		it("should contain connections", function() {
			expect(fake_api.connections).to.be.not.empty
		})
		it("should return friends for fake users", function() {
			for(var i=0; i<100; i++) {
				var id = _.random(1, fake_api.num_fake_users)
				var friends = fake_api.getFriends(id, _.random(0, 1))
				expect(friends).to.be.instanceOf(Array)
			}
		})
	})
})