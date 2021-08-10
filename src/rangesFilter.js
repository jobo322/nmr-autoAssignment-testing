import { labileProtoSignalFilter } from './labileProtoSignalFilter';
import { labileData } from './labileData'; 
import { xFindClosestIndex} from 'ml-spectra-processing'
import { baselineData } from './baselineData'
import { xyAutoRangesPicking } from 'nmr-processing';

export function rangesFilter(data, molecule, ranges){
    console.log('ranges: ', ranges);
    molecule.addImplicitHydrogens();
    let labileProton = labileData(molecule);
    if (labileProton.hasLabile === false){
        return ranges
    }
    else if (labileProton.hasLabile === true){
        let labileSignal = labileProtoSignalFilter(data, ranges)
        let labileProtonRange = ranges.filter( x => (x.from <= labileSignal.signal.x && x.to > labileSignal.signal.x))
        let lowerBoundData = [labileProtonRange[0].from, labileSignal.from].sort(function(a, b) {
            return a - b;
            });
        let upperBoundData = [labileProtonRange[0].to, labileSignal.to].sort(function(a, b) {
            return a - b;
            });
        let bounds = [lowerBoundData[lowerBoundData.length - 1],upperBoundData[0]];
        let baseline = baselineData(data, ranges).y
        let baselineMean = (baseline.reduce(function(a, b){
            return a + b;
        }, 0))/ baseline.length
        let experimentalSpectraClone = Object.assign({}, data)
        
        let labileRange = {
            from: bounds[0],
            to: bounds[1],
            labile : true
        }
        let labileRangeIndexes = {
            from: xFindClosestIndex(data.x, labileRange.from),
            to: xFindClosestIndex(data.x, labileProton.to),
        }
        experimentalSpectraClone.y.fill(baselineMean,labileRangeIndexes.from, labileRangeIndexes.to +1)
        let nH =
        molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/, '$1') * 1;        
        let newRanges = xyAutoRangesPicking(experimentalSpectraClone);
        let labileProtonNumber = labileProton.nbAllLabiles
        let nonLabileTotalArea = (newRanges.map(a => a.integral).reduce(function(a, b){
            return a + b;
        }, 0))
        for(let i = 0; i < newRanges.length; i++){
            newRanges[i].integral *= (nH - labileProtonNumber) / nonLabileTotalArea
            newRanges[i].labile = false
        }
        for(let i = 0; i < newRanges.length; i++){
        }

        let labileArea = (data.y.slice(labileRange.from, labileRange.to + 1).reduce(function(a, b){
            return a + b;
        }, 0))
        labileRange.integral =   labileProtonNumber * labileArea / labileArea
        labileRange.signal = labileSignal.signal
        newRanges.push(labileRange)
        return newRanges
    }
}

