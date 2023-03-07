---
"ember-resources": minor
---

New Utils: UpdateFrequency and FrameRate

<details><summary>FrameRate</summary>

 Utility that uses requestAnimationFrame to report
 how many frames per second the current monitor is
 rendering at.
 
 The result is rounded to two decimal places.
 
 ```js
 import { FramRate } from 'ember-resources/util/fps';
 
 <template>
   {{FrameRate}}
 </template>
 ```

</details>


<details><summary>FrameRate</summary>


 Utility that will report the frequency of updates to tracked data.
 
 ```js
 import { UpdateFrequency } from 'ember-resources/util/fps';
 
 export default class Demo extends Component {
   @tracked someProp;
 
   @use updateFrequency = UpdateFrequency(() => this.someProp);
 
   <template>
     {{this.updateFrequency}}
   </template>
 }
 ```
 
 NOTE: the function passed to UpdateFrequency may not set tracked data.

</details>
