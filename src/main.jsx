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
  const $consolidation = <input class="form-control" type="number" step="5" min="180" max="365" value="180"/>;
  const consolidation = $consolidation.rx('val');
  const $primary = (
    <select class="form-control">
      <option value="march">March 3 (under 2020 law)</option>
      <option value="june">June 2 (under 2016 law)</option>
    </select>
  );

  const start = new Date(2019, 0, 1);
  const end = new Date(2021, 0, 1);
  const marchPrimary = moment(new Date(2020, 2, 3));
  const junePrimary = moment(new Date(2020, 5, 2));
  const primary = bind(() => $primary.rx('val').get() === 'march' ? marchPrimary : junePrimary);
  const primaryWindowOpen = bind(() => primary.get().clone().subtract(consolidation.get(), 'day'));
  const primaryWindowClose = bind(() => primary.get().clone().subtract(114, 'day'));
  const general = moment(new Date(2020, 10, 3));
  const generalWindowOpen = bind(() => general.clone().subtract(consolidation.get(), 'day'));
  const generalWindowClose = general.clone().subtract(114, 'day');

  const primaryRange = bind(() => moment.range(primaryWindowOpen.get(), primaryWindowClose.get()));
  const primaryVacancyRange = bind(() => moment.range(
    primaryWindowOpen.get().clone().subtract(30, 'days'), primaryWindowOpen.get())
  );

  const generalRange = bind(() => moment.range(generalWindowOpen.get(), generalWindowClose.get()));
  const generalVacancyRange = bind(() => moment.range(
    generalWindowOpen.get().clone().subtract(30, 'days'),
    generalWindowOpen.get()
  ));

  const totalRange = moment.range(start, end);

  const validDays = bind(() =>
    Array.from(totalRange.by('day'))
      .filter(day =>
        generalRange.get().contains(day)
        || primaryRange.get().contains(day)
        || generalVacancyRange.get().contains(day)
        || primaryVacancyRange.get().contains(day)
      ).length
  );
  const validPercent = bind(() => Math.floor(100 * validDays.get() / totalRange.diff('days')));

  return (
    <div class="container">
      <h2>Sim Charter Review!</h2>
      <h3>Background</h3>
      <p>
        The Sunnyvale Charter currently mandates that a special election must be held to fill vacancies
        on the city council. This election can only be consolidated with a general municipal or statewide election if
        said election is within 180 days of when the Council declares a vacancy. The Council has 30 days from the
        commencement of a vacancy to declare the seat vacant and call a special municipal election to fill the vacancy
        These 30 days can functionally can be added to the 180 day range.
        Furthermore, the California election code requires that a nomination period for candidates be held between
        113 days and 88 days prior to the election. If the vacancy does not fall within the date range 210 to 114 days
        before a general municipal or statewide election, a special election must be held.
      </p>
      <h3>Instructions</h3>
      <p>
        This app allows you to adjust the consolidation range and see how this affects the ranges
        when special elections would have to be held during 2019 and 2020, given a vacancy on
        a particular date. You can also select whether the primary election will be held in March (as scheduled
        in 2020) or June (as scheduled through 2018). As currently scheduled, the 2020 California primary will be held
        March 3, and the 2020 general election November 3.
      </p>
      <h3>Legend</h3>
      <div class="row">
        <ul class="col-md-6 list-unstyled">
          <li><div class="consolidate legend"/> special election could be consolidated with a
            general or statewide election.</li>
          <li><div class="discretionary legend"/> council could use its thirty day discretionary period
            to consolidate the special election.</li>
          <li><div class="special legend"/> special election required.</li>
        </ul>
        <form class="form-horizontal col-md-6">
          <p class="form-group">
            <span class="col-md-6 text-right">
              <label class="control-label">
                Consolidation range
              </label>
            </span>
            <span class="col-md-6">{$consolidation}</span>
          </p>
          <p class="form-group">
            <span class="col-md-6 text-right"><label class="control-label">Primary Date</label></span>
            <span class="col-md-6">{$primary}</span>
          </p>
        </form>
      </div>
      <h3>
        With a consolidation range of <strong>{consolidation}</strong> days, <strong>{validDays}</strong> days
        or <strong>{validPercent}</strong>% of all days can be consolidated in 2019-20.
      </h3>
      <p>
        <div class="row">
          <YearTable
            year={2019}
            generalRange={generalRange}
            primaryRange={primaryRange}
            primaryVacancyRange={primaryVacancyRange}
            generalVacancyRange={generalVacancyRange}
          />
        </div>
      </p>
      <footer>
        <p>
          This application is open source software, and is released under
          the <a href="https://opensource.org/licenses/MIT">MIT License</a>.
        </p>
        <p>
          Source code for this application can be found
          on <a href="https://github.com/rmehlinger/election-calendar-sunnyvale">Github</a>.
        </p>
        <p>© 2018 Richard Mehlinger.</p>
      </footer>
    </div>
  );
}

function YearTable({primaryRange, generalRange, primaryVacancyRange, generalVacancyRange}) {
  const yearRange = moment.range(new Date(2019, 0, 1), new Date(2021, 0, 0));
  console.info(primaryVacancyRange.get(), generalVacancyRange.get());
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
              generalRange.get().contains(day) ? 'consolidate' : (
                primaryVacancyRange.get().contains(day) ||
                generalVacancyRange.get().contains(day)
                ? 'discretionary'
                : 'special'
              )
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