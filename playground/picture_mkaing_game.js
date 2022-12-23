/* A race to train a reinformcent learning algorithm to draw some image
  -> Two canvases:
      1) the image created by the network
      2) (smaller) the image that the user is trying to recreate
  -> The score of the recreation
      - A pixel-level comparison
      - Something more complex? (one pixel level and one global)
  -> Want to make areas of the created image which are bad, not grade the created image as a whole
      - Can this be done for reinforcement learning?
*/


// Convert to ts?