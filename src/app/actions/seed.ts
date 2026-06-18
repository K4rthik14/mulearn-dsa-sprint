'use server'

import { createClient } from '@/utils/supabase/server'
import { isUserAdmin } from '@/utils/supabase/user'
import { revalidatePath } from 'next/cache'

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: dbUser } = await supabase
    .from('users')
    .select('isAdmin')
    .eq('id', user.id)
    .single()

  const mergedUser = {
    ...user,
    ...(dbUser || {})
  }
  return isUserAdmin(mergedUser)
}

export async function seedSprintsAction() {
  const supabase = await createClient()
  if (!(await checkAdmin(supabase))) {
    return { error: 'Unauthorized. Admin role required.' }
  }

  // 1. Define Sprints
  const sprints = [
    {
      name: '21-Day DSA Habit Builder',
      description: 'Build consistency with 21 days of step-by-step topics, from arrays and hash maps to graphs and DP.',
      slug: 'dsa-habit-21',
      durationDays: 21
    },
    {
      name: 'Blind 75 Interview Prep',
      description: 'Master the high-frequency LeetCode questions most commonly asked in technical interviews.',
      slug: 'blind-75',
      durationDays: 15
    },
    {
      name: '7-Day DP Intensive',
      description: 'Conquer Dynamic Programming. Covers memoization, grids, knapsack, and sequence matching.',
      slug: 'dp-intensive-7',
      durationDays: 7
    }
  ]

  // Insert Sprints
  for (const s of sprints) {
    const { data: existing } = await supabase.from('sprints').select('id').eq('slug', s.slug).maybeSingle()
    if (!existing) {
      const { error } = await supabase.from('sprints').insert(s)
      if (error) return { error: `Failed to insert sprint ${s.name}: ${error.message}` }
    }
  }

  // Fetch Sprints
  const { data: dbSprints, error: fetchSprintsErr } = await supabase.from('sprints').select('id, slug')
  if (fetchSprintsErr || !dbSprints) {
    return { error: `Failed to fetch sprints: ${fetchSprintsErr?.message}` }
  }

  const sprintMap = new Map(dbSprints.map(s => [s.slug, s.id]))

  // 2. Define Day Data
  const habitBuilderId = sprintMap.get('dsa-habit-21')!
  const blind75Id = sprintMap.get('blind-75')!
  const dpIntensiveId = sprintMap.get('dp-intensive-7')!

  const daysData = [
    // --- 21-Day Habit Builder ---
    {
      sprintId: habitBuilderId,
      dayNumber: 1,
      topic: 'Arrays & Hashing',
      description: 'Understand hash maps, frequency tables, and spatial complexity trade-offs.',
      difficulty: 'Easy',
      problems: [
        { title: 'Contains Duplicate', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/contains-duplicate/' },
        { title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' }
      ],
      resources: [
        { title: 'Video: Arrays & Hashing Introduction', url: 'https://www.youtube.com/watch?v=wBvZ5yN5rPM', type: 'YouTube' },
        { title: 'Article: Hash Table Mechanics', url: 'https://leetcode.com/discuss/study-guide/1183360/hashing-chords-a-complete-guide', type: 'Article' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 2,
      topic: 'Two Pointers',
      description: 'Manipulate sorted arrays by checking items from both sides inwards, or with fast/slow pointer steps.',
      difficulty: 'Easy',
      problems: [
        { title: 'Valid Palindrome', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-palindrome/' },
        { title: 'Two Sum II - Input Array Is Sorted', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/' }
      ],
      resources: [
        { title: 'Video: Two Pointers Explained', url: 'https://www.youtube.com/watch?v=On03HWe2t6E', type: 'YouTube' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 3,
      topic: 'Sliding Window',
      description: 'Optimize subarray problems from O(N^2) to O(N) by shifting left and right boundaries.',
      difficulty: 'Easy',
      problems: [
        { title: 'Best Time to Buy and Sell Stock', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' }
      ],
      resources: [
        { title: 'Article: Sliding Window Tech Guide', url: 'https://leetcode.com/discuss/study-guide/1495810/sliding-window-complete-guide', type: 'Article' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 4,
      topic: 'Stacks & Queues',
      description: 'Solve LIFO and FIFO challenges. Ideal for parenthesis matching, monotonic stacks, and nested parsing.',
      difficulty: 'Easy',
      problems: [
        { title: 'Valid Parentheses', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/' },
        { title: 'Min Stack', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/min-stack/' }
      ],
      resources: [
        { title: 'Video: Stack Operations', url: 'https://www.youtube.com/watch?v=gcT_yFy6014', type: 'YouTube' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 5,
      topic: 'Linked Lists',
      description: 'Manipulate pointers, reverse node chains, and detect loops in linked memory structures.',
      difficulty: 'Easy',
      problems: [
        { title: 'Reverse Linked List', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-linked-list/' },
        { title: 'Merge Two Sorted Lists', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' }
      ],
      resources: [
        { title: 'Video: Linked List Reversal Walkthrough', url: 'https://www.youtube.com/watch?v=G0_I-ZF0S38', type: 'YouTube' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 6,
      topic: 'Binary Search',
      description: 'Search structured log-time data by bisecting search spaces.',
      difficulty: 'Easy',
      problems: [
        { title: 'Binary Search', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/binary-search/' },
        { title: 'Search in Rotated Sorted Array', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' }
      ],
      resources: [
        { title: 'Video: Binary Search Deep Dive', url: 'https://www.youtube.com/watch?v=s4DPM8ct1Hs', type: 'YouTube' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 7,
      topic: 'Recursion & Backtracking',
      description: 'Explore state trees and prune invalid paths in exhaustive search spaces.',
      difficulty: 'Medium',
      problems: [
        { title: 'Subsets', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/subsets/' }
      ],
      resources: [
        { title: 'Article: Backtracking Template', url: 'https://leetcode.com/discuss/study-guide/1405817/backtracking-template-questions-pattern', type: 'Article' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 8,
      topic: 'Trees: DFS & BFS',
      description: 'Traverse hierarchies using pre/in/post-order recursion (DFS) and level-order queues (BFS).',
      difficulty: 'Medium',
      problems: [
        { title: 'Invert Binary Tree', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/invert-binary-tree/' },
        { title: 'Binary Tree Level Order Traversal', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' }
      ],
      resources: [
        { title: 'Video: Tree Traversal Visualized', url: 'https://www.youtube.com/watch?v=fAAZixFz5XY', type: 'YouTube' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 9,
      topic: 'Binary Search Trees',
      description: 'Examine BST ordering rules: Left child is smaller, right is larger. Validate search properties.',
      difficulty: 'Medium',
      problems: [
        { title: 'Validate Binary Search Tree', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/' }
      ],
      resources: [
        { title: 'Video: BST Construction & Rules', url: 'https://www.youtube.com/watch?v=wptevk0bshY', type: 'YouTube' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 10,
      topic: 'Heaps / Priority Queues',
      description: 'Dynamically extract the minimum or maximum in constant time. Ideal for K-way sorting.',
      difficulty: 'Medium',
      problems: [
        { title: 'Kth Largest Element in an Array', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' }
      ],
      resources: [
        { title: 'Article: Heap Implementations', url: 'https://leetcode.com/discuss/study-guide/1212004/heaps-priority-queues-a-complete-guide', type: 'Article' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 11,
      topic: 'Hashing Advanced',
      description: 'Solve grouping problems, anagram clustering, and continuous streaks using fast dictionary lookup.',
      difficulty: 'Medium',
      problems: [
        { title: 'Group Anagrams', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/group-anagrams/' },
        { title: 'Top K Frequent Elements', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/' }
      ],
      resources: []
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 12,
      topic: 'Graphs: DFS & BFS',
      description: 'Model network systems. Represent graphs with adjacency lists, and explore nodes without cycle loops.',
      difficulty: 'Medium',
      problems: [
        { title: 'Clone Graph', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/clone-graph/' },
        { title: 'Course Schedule', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule/' }
      ],
      resources: [
        { title: 'Video: Graph Algorithms Course', url: 'https://www.youtube.com/watch?v=tLYjLj53cE8', type: 'YouTube' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 13,
      topic: 'Graphs: Matrix Paths',
      description: 'Scan grid matrices as implicit graphs. Use flood-fills and track visited coordinate states.',
      difficulty: 'Medium',
      problems: [
        { title: 'Number of Islands', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-islands/' }
      ],
      resources: []
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 14,
      topic: 'Dynamic Programming (1D)',
      description: 'Optimize recursion by caching subproblems. Solve steps, robbery grids, and coin counts.',
      difficulty: 'Medium',
      problems: [
        { title: 'Climbing Stairs', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' },
        { title: 'House Robber', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber/' }
      ],
      resources: [
        { title: 'Video: Dynamic Programming Introduction', url: 'https://www.youtube.com/watch?v=oBt53YbR9Kk', type: 'YouTube' }
      ]
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 15,
      topic: 'Dynamic Programming (2D)',
      description: 'Solve multi-state grids. Track grid paths, matches, and edit weights between sequences.',
      difficulty: 'Medium',
      problems: [
        { title: 'Unique Paths', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/unique-paths/' },
        { title: 'Longest Common Subsequence', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-common-subsequence/' }
      ],
      resources: []
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 16,
      topic: 'Greedy Algorithms',
      description: 'Make locally optimal choices. Solve scheduling, gas fillups, and jumps.',
      difficulty: 'Medium',
      problems: [
        { title: 'Jump Game', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/jump-game/' }
      ],
      resources: []
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 17,
      topic: 'Intervals',
      description: 'Sort and merge overlapping coordinate intervals. Vital for calendars and scheduler rooms.',
      difficulty: 'Medium',
      problems: [
        { title: 'Merge Intervals', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/merge-intervals/' },
        { title: 'Insert Interval', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-interval/' }
      ],
      resources: []
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 18,
      topic: 'Tries',
      description: 'Implement word prefix trees for quick lookup, auto-completion, and spellcheck.',
      difficulty: 'Medium',
      problems: [
        { title: 'Implement Trie (Prefix Tree)', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/' }
      ],
      resources: []
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 19,
      topic: 'Bit Manipulation',
      description: 'Apply fast binary math. Master XOR cancellations, bit shifting, and bitmasking.',
      difficulty: 'Easy',
      problems: [
        { title: 'Single Number', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/single-number/' },
        { title: 'Number of 1 Bits', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/number-of-1-bits/' }
      ],
      resources: []
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 20,
      topic: 'Advanced Graphs',
      description: 'Implement shortest path (Dijkstra) and minimum spanning tree (Kruskal/Prim) algorithms.',
      difficulty: 'Hard',
      problems: [
        { title: 'Network Delay Time', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/network-delay-time/' }
      ],
      resources: []
    },
    {
      sprintId: habitBuilderId,
      dayNumber: 21,
      topic: 'Grand Finale Sprint',
      description: 'Solve peak interview challenges. Wrap up your 21-day streak with hard classics.',
      difficulty: 'Hard',
      problems: [
        { title: 'Median of Two Sorted Arrays', platform: 'LeetCode', difficulty: 'Hard', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/' }
      ],
      resources: []
    },

    // --- Blind 75 ---
    {
      sprintId: blind75Id,
      dayNumber: 1,
      topic: 'Arrays & Hashing (Blind 75)',
      description: 'Master core array structures and lookup techniques.',
      difficulty: 'Easy',
      problems: [
        { title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
        { title: 'Contains Duplicate', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/contains-duplicate/' },
        { title: 'Valid Anagram', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-anagram/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 2,
      topic: 'Two Pointers (Blind 75)',
      description: 'Scan arrays from opposite ends inwards to optimize search.',
      difficulty: 'Easy',
      problems: [
        { title: 'Valid Palindrome', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-palindrome/' },
        { title: 'Container With Most Water', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/container-with-most-water/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 3,
      topic: 'Sliding Window (Blind 75)',
      description: 'Identify subsegments of arrays dynamically.',
      difficulty: 'Medium',
      problems: [
        { title: 'Longest Substring Without Repeating Characters', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 4,
      topic: 'Stacks & Queues (Blind 75)',
      description: 'Maintain linear structures with access restrictions.',
      difficulty: 'Easy',
      problems: [
        { title: 'Valid Parentheses', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 5,
      topic: 'Linked Lists (Blind 75)',
      description: 'Pointers manipulations and nodes rearrangement.',
      difficulty: 'Medium',
      problems: [
        { title: 'Reverse Linked List', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-linked-list/' },
        { title: 'Merge Two Sorted Lists', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
        { title: 'Linked List Cycle', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/linked-list-cycle/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 6,
      topic: 'Binary Search (Blind 75)',
      description: 'Locating positions in sorted collections in log-time.',
      difficulty: 'Medium',
      problems: [
        { title: 'Search in Rotated Sorted Array', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
        { title: 'Find Minimum in Rotated Sorted Array', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 7,
      topic: 'Trees (Blind 75)',
      description: 'Traversing tree nodes using DFS recursively.',
      difficulty: 'Easy',
      problems: [
        { title: 'Invert Binary Tree', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/invert-binary-tree/' },
        { title: 'Maximum Depth of Binary Tree', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
        { title: 'Same Tree', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/same-tree/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 8,
      topic: 'Binary Search Trees (Blind 75)',
      description: 'Validating and searching ordered hierarchies.',
      difficulty: 'Medium',
      problems: [
        { title: 'Lowest Common Ancestor of a Binary Search Tree', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 9,
      topic: 'Heaps (Blind 75)',
      description: 'Keeping track of top items dynamically.',
      difficulty: 'Hard',
      problems: [
        { title: 'Merge k Sorted Lists', platform: 'LeetCode', difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
        { title: 'Top K Frequent Elements', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 10,
      topic: 'Graphs (Blind 75)',
      description: 'DFS/BFS on graph structures, cycle detection.',
      difficulty: 'Medium',
      problems: [
        { title: 'Number of Islands', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-islands/' },
        { title: 'Clone Graph', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/clone-graph/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 11,
      topic: 'Tries (Blind 75)',
      description: 'Prefix matching operations.',
      difficulty: 'Medium',
      problems: [
        { title: 'Implement Trie (Prefix Tree)', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 12,
      topic: '1D Dynamic Programming (Blind 75)',
      description: 'Introduction to simple state transitions.',
      difficulty: 'Medium',
      problems: [
        { title: 'Climbing Stairs', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' },
        { title: 'Coin Change', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 13,
      topic: '2D Dynamic Programming (Blind 75)',
      description: 'Grid paths and matrix sequences transitions.',
      difficulty: 'Medium',
      problems: [
        { title: 'Longest Common Subsequence', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-common-subsequence/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 14,
      topic: 'Greedy & Intervals (Blind 75)',
      description: 'Interval management, merging schedules.',
      difficulty: 'Medium',
      problems: [
        { title: 'Merge Intervals', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/merge-intervals/' },
        { title: 'Non-overlapping Intervals', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/non-overlapping-intervals/' }
      ],
      resources: []
    },
    {
      sprintId: blind75Id,
      dayNumber: 15,
      topic: 'Bit Manipulation (Blind 75)',
      description: 'Understanding bitwise logical filters.',
      difficulty: 'Easy',
      problems: [
        { title: 'Number of 1 Bits', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/number-of-1-bits/' },
        { title: 'Counting Bits', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/counting-bits/' }
      ],
      resources: []
    },

    // --- 7-Day DP Intensive ---
    {
      sprintId: dpIntensiveId,
      dayNumber: 1,
      topic: 'Recursion & Memoization Basics',
      description: 'Transition from recursive equations to memoized subproblems.',
      difficulty: 'Easy',
      problems: [
        { title: 'Fibonacci Number', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/fibonacci-number/' },
        { title: 'Climbing Stairs', platform: 'LeetCode', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' }
      ],
      resources: []
    },
    {
      sprintId: dpIntensiveId,
      dayNumber: 2,
      topic: '1D DP - Grid Paths',
      description: 'Compute path counts and weights on multi-dimensional grids.',
      difficulty: 'Medium',
      problems: [
        { title: 'Unique Paths', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/unique-paths/' },
        { title: 'Unique Paths II', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/unique-paths-ii/' }
      ],
      resources: []
    },
    {
      sprintId: dpIntensiveId,
      dayNumber: 3,
      topic: '1D DP - Subsequences',
      description: 'Find optimal subsequences within linear lists.',
      difficulty: 'Medium',
      problems: [
        { title: 'Longest Increasing Subsequence', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-increasing-subsequence/' }
      ],
      resources: []
    },
    {
      sprintId: dpIntensiveId,
      dayNumber: 4,
      topic: 'Knapsack Problems',
      description: 'Solve bounded and unbounded subset selections.',
      difficulty: 'Medium',
      problems: [
        { title: 'Partition Equal Subset Sum', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/partition-equal-subset-sum/' }
      ],
      resources: []
    },
    {
      sprintId: dpIntensiveId,
      dayNumber: 5,
      topic: '2D DP - Sequence Matching',
      description: 'Calculate alignments and edits between two string variables.',
      difficulty: 'Medium',
      problems: [
        { title: 'Longest Common Subsequence', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-common-subsequence/' },
        { title: 'Edit Distance', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/edit-distance/' }
      ],
      resources: []
    },
    {
      sprintId: dpIntensiveId,
      dayNumber: 6,
      topic: 'DP on Strings',
      description: 'Substrings, palindromes, and splits optimization.',
      difficulty: 'Medium',
      problems: [
        { title: 'Longest Palindromic Substring', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/' },
        { title: 'Palindromic Substrings', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/palindromic-substrings/' }
      ],
      resources: []
    },
    {
      sprintId: dpIntensiveId,
      dayNumber: 7,
      topic: 'Advanced DP / Game Theory',
      description: 'Minimax state grids and window burst calculations.',
      difficulty: 'Hard',
      problems: [
        { title: 'Stone Game', platform: 'LeetCode', difficulty: 'Medium', url: 'https://leetcode.com/problems/stone-game/' }
      ],
      resources: []
    }
  ]

  // Insert Challenge Days, Problems, Resources
  try {
    for (const day of daysData) {
      // 1. Check if day already exists for this sprint
      const { data: existingDay } = await supabase
        .from('challengedays')
        .select('id')
        .eq('sprintId', day.sprintId)
        .eq('dayNumber', day.dayNumber)
        .maybeSingle()

      let challengeDayId = existingDay?.id

      if (!existingDay) {
        const { data: insertedDay, error: dayInsertErr } = await supabase
          .from('challengedays')
          .insert({
            sprintId: day.sprintId,
            dayNumber: day.dayNumber,
            topic: day.topic,
            description: day.description,
            difficulty: day.difficulty,
            unlockDay: null
          })
          .select('id')
          .single()

        if (dayInsertErr || !insertedDay) {
          return { error: `Failed to insert day ${day.dayNumber} for sprint ${day.sprintId}: ${dayInsertErr?.message}` }
        }
        challengeDayId = insertedDay.id
      }

      // 2. Insert Problems
      for (let i = 0; i < day.problems.length; i++) {
        const prob = day.problems[i]
        const { data: existingProb } = await supabase
          .from('problems')
          .select('id')
          .eq('challengeDayId', challengeDayId)
          .eq('title', prob.title)
          .maybeSingle()

        if (!existingProb) {
          const { error: probInsertErr } = await supabase
            .from('problems')
            .insert({
              challengeDayId,
              title: prob.title,
              platform: prob.platform,
              difficulty: prob.difficulty,
              points: 10,
              orderIndex: i,
              url: prob.url
            })
          if (probInsertErr) {
            console.error(`Failed to insert problem ${prob.title}:`, probInsertErr.message)
          }
        }
      }

      // 3. Insert Resources
      for (const res of day.resources) {
        const { data: existingRes } = await supabase
          .from('resources')
          .select('id')
          .eq('challengeDayId', challengeDayId)
          .eq('title', res.title)
          .maybeSingle()

        if (!existingRes) {
          const { error: resInsertErr } = await supabase
            .from('resources')
            .insert({
              challengeDayId,
              title: res.title,
              url: res.url,
              type: res.type
            })
          if (resInsertErr) {
            console.error(`Failed to insert resource ${res.title}:`, resInsertErr.message)
          }
        }
      }
    }
  } catch (err: any) {
    return { error: `Transaction error during seeding: ${err.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')

  return { success: true }
}
