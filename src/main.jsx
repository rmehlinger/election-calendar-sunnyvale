const $ = require('jquery');
const moment = require('moment');
const {extendMoment} = require('moment-range');
extendMoment(moment);

const rx = require('bobtail');
const {bind, rxt} = rx;
const {tags} = rxt;

const STATE_PRECEDER = 113;

// general election is first Tuesday after first Monday in November;
// as of 2019 primaries will be first Tuesday after first Monday in March.
// in 2020: Mar 3 and Nov 3

function App() {
  const vacancyDeadline = 30;
  const $consolidation = <input class="form-control" type="number" step="5" min="180" max="365" value="180"/>;
  const consolidation = $consolidation.rx('val');
  const netConsolidation = bind(() => parseInt(consolidation.get()) + vacancyDeadline);
  const $primary = (
    <select class="form-control">
      <option value="march">March 3 (current law)</option>
      <option value="june">June 2 (under 2016 law)</option>
    </select>
  );

  const start = new Date(2019, 0, 1);
  const end = new Date(2021, 0, 1);
  const marchPrimary = moment(new Date(2020, 2, 3));
  const junePrimary = moment(new Date(2020, 5, 2));
  const primary = bind(() => $primary.rx('val').get() === 'march' ? marchPrimary : junePrimary);
  const primaryDeadline = bind(() =>primary.get().clone().subtract(114, 'day'));
  const general = moment(new Date(2020, 10, 3));
  const generalDeadline = general.clone().subtract(114, 'day');

  const primaryRange = bind(() => moment.range(
    primary.get().clone().subtract(netConsolidation.get(), 'day'),
    primaryDeadline.get()
  ));

  const generalRange = bind(() => moment.range(
    general.clone().subtract(netConsolidation.get(), 'day'),
    generalDeadline
  ));

  const totalRange = moment.range(start, end);

  const validDays = bind(() =>
    Array.from(totalRange.by('day'))
      .filter(day =>
        generalRange.get().contains(day) || primaryRange.get().contains(day)
      ).length
  );
  const validPercent = bind(() => Math.floor(100 * validDays.get() / totalRange.diff('days')));

  return (
    <div class="container">
      <h1>Sim Charter Review!</h1>
      <p>
        The Sunnyvale Charter currently mandates that a special election held to fill a vacancy
        on the city council can only be consolidated with a state election if the state election this
        within 180 days from when the Council declares a vacancy. The Council has 30 days to do so, which,
        functionally, can be added to the 180 day range. Furthermore, the California election code requires that an
        election be announced no fewer than 113 days prior to when it is to be held, with a 25 day candidate
        registration period. If the vacancy does not fall within this range, a special election must be held.
      </p>
      <p>
        This app allows you to adjust the consolidation range and see how this affects the ranges
        when special elections would have to be held during 2019 and 2020, given a vacancy on
        a particular date.
      </p>
      <p>
        The 2020 California primary will be held March 3, and the 2020 general election November 3.
      </p>
      <form class="form-horizontal">
        <p class="form-group">
          <span class="col-md-3 text-right">
            <label class="control-label">
              Consolidation range
            </label>
          </span>
          <span class="col-md-3">{$consolidation}</span>
        </p>
        <p class="form-group">
          <span class="col-md-3 text-right"><label class="control-label">Primary Date</label></span>
          <span class="col-md-3">{$primary}</span>
        </p>
      </form>
      <h3>
        With a consolidation range of <strong>{consolidation}</strong> days, <strong>{validDays}</strong> days
        or <strong>{validPercent}</strong>% of all days can be consolidated in 2019-20.
      </h3>
      <p>
        <div class="row">
          <YearTable year={2019} generalRange={generalRange} primaryRange={primaryRange} />
        </div>
      </p>
      <footer>
        <p>
          This application is open source software, and is released under the <a href="https://opensource.org/licenses/MIT">MIT License</a>.
        </p>
        <p>
          Source code for this application can be found on <a href="https://github.com/rmehlinger/election-calendar-sunnyvale">Github</a>.
        </p>
        <p>© 2018 Richard Mehlinger.</p>
      </footer>
    </div>
  );
}

function YearTable({primaryRange, generalRange}) {
  const yearRange = moment.range(new Date(2019, 0, 1), new Date(2021, 0, 0));
  return (
    <table class="col-md-12 table table-bordered">
      <thead>

      </thead>
      <tbody>
      {Array.from(yearRange.by('month')).map(month =>
        <tr>
          <th>{month.format('MMMM')}</th>
          {Array.from(moment.range(month, month.clone().add(1, 'month').subtract(1, 'day')).by('day')).map(day =>
            <td class={() =>
              primaryRange.get().contains(day) ||
              generalRange.get().contains(day) ? 'consolidate' : 'special'
            }>
              <span class="text-muted">{(parseInt(month.format('MM')) - 1) % 3 ? ' ' : day.format('DD')}</span>
            </td>
          )}
        </tr>
      )}
      </tbody>
    </table>
  );
}

$(document).ready(() => $('body').append(<App />));