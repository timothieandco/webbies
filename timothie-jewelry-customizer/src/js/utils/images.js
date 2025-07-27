/**
 * Image imports - webpack requires explicit imports for assets
 */

// Necklace images
import plainChain from '../../assets/images/necklaces/plainChain.png';

// Charm images
import charmOne from '../../assets/images/charms/charmOne.png';
import charmTwo from '../../assets/images/charms/charmTwo.png';
import charmThree from '../../assets/images/charms/charmThree.png';
import charmFour from '../../assets/images/charms/charmFour.png';
import charmFive from '../../assets/images/charms/charmFive.png';
import charmSix from '../../assets/images/charms/charmSix.png';
import charmSeven from '../../assets/images/charms/charmSeven.png';
import charmEight from '../../assets/images/charms/charmEight.png';

export const necklaceImages = {
    plainChain
};

export const charmImages = {
    charmOne,
    charmTwo,
    charmThree,
    charmFour,
    charmFive,
    charmSix,
    charmSeven,
    charmEight
};

export default {
    necklaces: necklaceImages,
    charms: charmImages
};