import _ from 'lodash';
import VK from './vk';

const DELAY_BETWEEN_REQUESTS = 1000;

interface GraphOptions {
  startingUserId: number;

  depth: number;

  includeStartingUser: boolean;
}

export default class Graph {
  private startingUserId: number;
  private depth: number;
  private includeStartingUser: boolean;

  private currentUserId: number;

  private numUsersInQueue: number;
  private numUsersCompleted: number;

  private data: any = null;
  
  constructor(options: GraphOptions) {
    this.startingUserId = options.startingUserId;
    this.depth = options.depth;
    this.includeStartingUser = options.includeStartingUser;
  }

  private graph() {
    if (this.data() !== null) {
      const exclude = this.includeStartingUser ? [ this.startingUserId ] : [];

      return VK.toGraph(this.data.friends, this.data.links, exclude);
    }
  }

  private numUsersInGraph() {
    if (!this.graph) return this.graph().nodes.length;
  }

  public start() {
    const trav = new VK.Traverser(VK.requester);

    trav.enqueue(this.startingUserId, this.depth);

    const onNext = () => {
      if (!trav.isCompleted()) {
        this.numUsersInQueue = trav.queue.length;
        this.numUsersCompleted = _.keys(trav.links).length;

        setTimeout(() => {
          trav.next(onNext);
        }, DELAY_BETWEEN_REQUESTS);
      } else {
        this.data = {
          friends: trav.friends, 
          links: trav.links
        };
      }
    }

    trav.next(onNext);
  }
}


