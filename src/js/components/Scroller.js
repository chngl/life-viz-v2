var Scroller = React.createClass({

  stages: [
    {title: 'stage1', text: 'This is stage1.'}, 
    {title: 'stage2', text: 'This is stage2.'}, 
    {title: 'stage3', text: 'This is stage3.'}, 
  ],

  componentDidMount: function() {
    console.log('mounted');
  },

  render: function(){
    return (
      <div className={'scroller'}> 
        {
          this.stages.map(function(stage) { 
            return (
              <section className={'stage'}>
                <div className={'title'}>{stage.title}</div>
                <p className={'main-text'}>{stage.text}</p>
              </section>
            );
          })
        }
      </div>
    );
  }
});

module.exports = Scroller;

