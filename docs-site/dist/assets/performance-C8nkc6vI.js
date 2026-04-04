import{j as e}from"./index-d6EXP2Gi.js";function a(){return e.jsxs("div",{className:"doc-page",children:[e.jsxs("header",{children:[e.jsx("h1",{className:"page-title",children:"Performance & Scaling"}),e.jsx("p",{className:"page-desc",children:"Best practices for ensuring your tables remain fast and responsive with 100k+ rows."})]}),e.jsx("h2",{children:"Virtualization"}),e.jsxs("p",{children:["The most important step for scale is virtualization. The ",e.jsx("code",{children:"useVirtualRows"})," plugin will only render the HTML TR elements that are currently visible within the scrolling viewport."]}),e.jsx("div",{className:"callout",children:"Ensure you give your table wrapper a fixed height and `overflow: auto` or the virtualizer will not work!"}),e.jsx("h2",{children:"Data Memoization"}),e.jsxs("p",{children:["Always memoize your data and column definitions using ",e.jsx("code",{children:"useMemo"}),". Failing to do so will cause the table core engine to recalculate internals on every React render."]}),e.jsx("pre",{className:"language-tsx",children:e.jsx("code",{dangerouslySetInnerHTML:{__html:`// Good
const columns = useMemo(() => [
  { id: 'name', accessorKey: 'name' }
], []);

// Bad
const columns = [
  { id: 'name', accessorKey: 'name' }
];`}})}),e.jsx("h2",{children:"Bundle Splitting & Lazy Exports"}),e.jsx("p",{children:"If you don't use a plugin, don't import it! React Pivot Pro is heavily modularized to guarantee small payload sizes."})]})}export{a as default};
